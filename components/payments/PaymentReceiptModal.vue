<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="$emit('close')">
    <div class="w-full max-w-lg rounded-lg border-2 border-black bg-white shadow-lg">
      <div class="flex items-center justify-between border-b-2 border-black px-5 py-4">
        <h2 class="text-xl font-bold text-saturnator-gray-dark">License receipt</h2>
        <button type="button" class="text-sm font-bold text-saturnator-gray-medium hover:text-saturnator-gray-dark" @click="$emit('close')">
          Close
        </button>
      </div>

      <div class="space-y-3 px-5 py-5 text-sm text-saturnator-gray-dark">
        <div>
          <p class="text-xs font-bold uppercase tracking-wide text-saturnator-gray-medium">Asset</p>
          <p class="mt-1 font-semibold">{{ receipt.assetTitle || receipt.assetId }}</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-saturnator-gray-medium">License</p>
            <p class="mt-1 font-semibold">{{ receipt.licenseType?.replace(/_/g, ' ') }}</p>
            <p class="text-xs text-saturnator-gray-medium">{{ receipt.licenseVersion }}</p>
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-saturnator-gray-medium">Amount</p>
            <p class="mt-1 font-semibold">{{ receipt.amountUsd || '—' }} USDC</p>
          </div>
        </div>
        <div v-if="receipt.sellerWalletAddress">
          <p class="text-xs font-bold uppercase tracking-wide text-saturnator-gray-medium">Recipient wallet</p>
          <p class="mt-1 font-mono text-xs break-all">{{ shorten(receipt.sellerWalletAddress) }}</p>
        </div>
        <div v-if="receipt.transactionSignature">
          <p class="text-xs font-bold uppercase tracking-wide text-saturnator-gray-medium">Solana transaction</p>
          <a
            :href="receipt.explorerUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-1 inline-block font-semibold text-saturnator-blue-medium underline"
          >
            View on Explorer
          </a>
        </div>
        <p v-if="receipt.alreadyOwned" class="rounded-lg border border-black bg-saturnator-gray-light px-3 py-2 text-xs font-medium">
          You already own this license — refreshing or clicking buy again will not charge you.
        </p>
      </div>

      <div class="flex flex-wrap gap-3 border-t-2 border-black px-5 py-4">
        <button
          type="button"
          class="rounded-lg border-2 border-black bg-saturnator-blue-medium px-4 py-2 text-sm font-bold text-white hover:bg-saturnator-blue-dark"
          @click="$emit('download')"
        >
          Download
        </button>
        <button
          type="button"
          class="rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-bold text-saturnator-gray-dark hover:bg-gray-100"
          @click="$emit('close')"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LicenseReceipt } from '../../stores/license'

defineProps<{ receipt: LicenseReceipt }>()
defineEmits<{ close: []; download: [] }>()

function shorten(addr: string) {
  if (!addr || addr.length < 12) return addr
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}
</script>
