# Strapi Configuration Guide for Saturnator

## 🚀 Quick Setup

### 1. Environment Variables
Create a `.env` file in your `saturnator-api` directory:

```env
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-app-key-1,your-app-key-2,your-app-key-3,your-app-key-4
API_TOKEN_SALT=your-api-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
JWT_SECRET=your-jwt-secret
STRAPI_URL=http://localhost:1337
```

### 2. CORS Configuration
Update `saturnator-api/config/middlewares.ts`:

```typescript
export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'http://localhost:3000', 'http://localhost:3001'],
          'img-src': ["'self'", 'data:', 'blob:', 'http://localhost:1337'],
          'media-src': ["'self'", 'data:', 'blob:', 'http://localhost:1337'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003']
    }
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

## 📊 Content Types Setup

### 1. Track Content Type
Create `saturnator-api/src/api/track/content-types/track/schema.json`:

```json
{
  "kind": "collectionType",
  "collectionName": "tracks",
  "info": {
    "singularName": "track",
    "pluralName": "tracks",
    "displayName": "Track",
    "description": "Music tracks and samples"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "description": {
      "type": "text"
    },
    "artist": {
      "type": "string",
      "required": true
    },
    "bpm": {
      "type": "integer",
      "min": 1,
      "max": 999
    },
    "trackType": {
      "type": "enumeration",
      "enum": ["sample", "track", "album"],
      "required": true
    },
    "status": {
      "type": "enumeration",
      "enum": ["pending", "approved", "rejected"],
      "default": "pending"
    },
    "audioFile": {
      "type": "media",
      "multiple": false,
      "required": true,
      "allowedTypes": ["audios"]
    },
    "coverImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "genres": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::genre.genre"
    },
    "slug": {
      "type": "uid",
      "targetField": "title"
    }
  }
}
```

### 2. Genre Content Type
Create `saturnator-api/src/api/genre/content-types/genre/schema.json`:

```json
{
  "kind": "collectionType",
  "collectionName": "genres",
  "info": {
    "singularName": "genre",
    "pluralName": "genres",
    "displayName": "Genre",
    "description": "Music genres"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "name": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "description": {
      "type": "text"
    },
    "tracks": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::track.track",
      "mappedBy": "genres"
    }
  }
}
```

### 3. Artist Content Type
Create `saturnator-api/src/api/artist/content-types/artist/schema.json`:

```json
{
  "kind": "collectionType",
  "collectionName": "artists",
  "info": {
    "singularName": "artist",
    "pluralName": "artists",
    "displayName": "Artist",
    "description": "Music artists"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "name": {
      "type": "string",
      "required": true
    },
    "bio": {
      "type": "text"
    },
    "socialLinks": {
      "type": "json"
    },
    "profileImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "tracks": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::track.track",
      "mappedBy": "artist"
    }
  }
}
```

## 🔐 User Roles & Permissions

### 1. Public Role
- **Tracks**: Read (only approved tracks)
- **Genres**: Read
- **Artists**: Read

### 2. Authenticated Role
- **Tracks**: Read (only approved tracks), Create (own tracks)
- **Genres**: Read
- **Artists**: Read

### 3. Admin Role
- **Tracks**: Read, Create, Update, Delete (all tracks)
- **Genres**: Read, Create, Update, Delete
- **Artists**: Read, Create, Update, Delete
- **Users**: Read, Create, Update, Delete

## 🎯 Admin Panel Configuration

### 1. Access Admin Panel
1. Start Strapi: `npm run develop`
2. Visit: `http://localhost:1337/admin`
3. Create your first admin account

### 2. Configure Permissions
1. Go to **Settings** → **Users & Permissions Plugin** → **Roles**
2. Configure each role with appropriate permissions
3. For **Public** role, ensure only approved tracks are readable

### 3. Media Library Settings
1. Go to **Settings** → **Media Library**
2. Configure file size limits:
   - Audio files: 50MB
   - Images: 5MB
3. Set allowed file types:
   - Audio: mp3, wav, flac
   - Images: jpg, jpeg, png, webp

### 4. API Token Configuration
1. Go to **Settings** → **API Tokens**
2. Create tokens for different access levels:
   - **Public API**: Read-only access
   - **Upload API**: Create access for authenticated users
   - **Admin API**: Full access

## 🔧 Custom Controllers & Services

### 1. Home Page Controller
Create `saturnator-api/src/api/home-page/controllers/home-page.ts`:

```typescript
export default {
  async find(ctx) {
    const { query } = ctx;
    
    // Get approved tracks with filters
    const tracks = await strapi.entityService.findMany('api::track.track', {
      filters: {
        status: 'approved',
        ...(query.artist && { artist: { $containsi: query.artist } }),
        ...(query.genre && { genres: { id: { $eq: query.genre } } }),
        ...(query.bpmMin && { bpm: { $gte: query.bpmMin } }),
        ...(query.bpmMax && { bpm: { $lte: query.bpmMax } }),
        ...(query.trackType && { trackType: query.trackType })
      },
      populate: ['coverImage', 'genres'],
      pagination: {
        page: query.page || 1,
        pageSize: query.pageSize || 12
      },
      sort: { createdAt: 'desc' }
    });

    return {
      data: tracks.results,
      meta: {
        pagination: tracks.pagination
      }
    };
  }
};
```

### 2. Track Controller
Create `saturnator-api/src/api/track/controllers/track.ts`:

```typescript
export default {
  async findOne(ctx) {
    const { id } = ctx.params;
    
    const track = await strapi.entityService.findOne('api::track.track', id, {
      populate: ['coverImage', 'audioFile', 'genres', 'artist']
    });

    // Check if track is approved or user is admin
    if (track.status !== 'approved' && !ctx.state.user?.role?.name === 'Admin') {
      return ctx.notFound();
    }

    return { data: track };
  },

  async create(ctx) {
    const { data } = ctx.request.body;
    const { user } = ctx.state;

    // Ensure user is authenticated
    if (!user) {
      return ctx.unauthorized();
    }

    // Set status to pending for new tracks
    data.status = 'pending';
    data.user = user.id;

    const track = await strapi.entityService.create('api::track.track', {
      data,
      files: ctx.request.files
    });

    return { data: track };
  }
};
```

## 🌐 API Endpoints

### Public Endpoints
- `GET /api/tracks` - Get approved tracks with filters
- `GET /api/tracks/:id` - Get specific track (if approved)
- `GET /api/genres` - Get all genres
- `GET /api/artists` - Get all artists

### Authenticated Endpoints
- `POST /api/tracks` - Upload new track (requires authentication)
- `GET /api/users/me` - Get current user profile

### Admin Endpoints
- `PUT /api/tracks/:id` - Update track
- `DELETE /api/tracks/:id` - Delete track
- `PUT /api/tracks/:id/approve` - Approve track
- `PUT /api/tracks/:id/reject` - Reject track

## 🚀 Deployment Considerations

### 1. Environment Variables for Production
```env
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-production-app-keys
API_TOKEN_SALT=your-production-salt
ADMIN_JWT_SECRET=your-production-admin-secret
JWT_SECRET=your-production-jwt-secret
STRAPI_URL=https://your-domain.com
DATABASE_URL=your-database-url
```

### 2. Database Configuration
For PostgreSQL, update `saturnator-api/config/database.ts`:

```typescript
export default ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'saturnator'),
      user: env('DATABASE_USERNAME', 'postgres'),
      password: env('DATABASE_PASSWORD', ''),
      ssl: env.bool('DATABASE_SSL', false),
    },
  },
});
```

### 3. File Upload Configuration
For cloud storage (AWS S3, Cloudinary, etc.), configure in `saturnator-api/config/plugins.ts`:

```typescript
export default ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        accessKeyId: env('AWS_ACCESS_KEY_ID'),
        secretAccessKey: env('AWS_ACCESS_SECRET'),
        region: env('AWS_REGION'),
        params: {
          Bucket: env('AWS_BUCKET'),
        },
      },
    },
  },
});
```

## 🔍 Testing Your Setup

### 1. Test API Endpoints
```bash
# Test public endpoint
curl http://localhost:1337/api/tracks

# Test authentication
curl -X POST http://localhost:1337/api/auth/local \
  -H "Content-Type: application/json" \
  -d '{"identifier":"your-email","password":"your-password"}'
```

### 2. Test File Upload
```bash
# Test track upload (requires authentication token)
curl -X POST http://localhost:1337/api/tracks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "data={\"title\":\"Test Track\",\"artist\":\"Test Artist\"}" \
  -F "files.audioFile=@/path/to/audio.mp3"
```

## 📝 Next Steps

1. **Start Strapi**: `cd saturnator-api && npm run develop`
2. **Configure Admin Panel**: Set up roles and permissions
3. **Create Sample Data**: Add genres and test tracks
4. **Test Frontend**: Ensure Nuxt app connects properly
5. **Deploy**: Set up production environment

## 🆘 Troubleshooting

### Common Issues:
1. **CORS Errors**: Ensure CORS is properly configured in middlewares
2. **File Upload Fails**: Check file size limits and allowed types
3. **Authentication Issues**: Verify JWT secrets and token configuration
4. **Database Connection**: Ensure database is running and accessible

### Debug Mode:
Enable debug logging in `saturnator-api/config/logger.ts`:

```typescript
export default ({ env }) => ({
  level: env('LOG_LEVEL', 'debug'),
});
``` 