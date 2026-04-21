<template>
  <header
    class="h-12 shrink-0 border-b border-white/10 bg-zinc-950/60 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/40"
  >
    <div class="h-full px-3 flex items-center gap-3">
      <div class="flex items-center gap-2">
        <div class="h-6 w-6 rounded-md bg-gradient-to-br from-fuchsia-400/90 to-cyan-300/80" />
        <div class="text-sm font-semibold tracking-wide text-white/90">Flow Editor</div>
      </div>
      <nav class="ml-4 flex items-center gap-1 text-sm text-white/70">
        <button class="px-2 py-1 rounded hover:bg-white/5" type="button">File</button>
        <button class="px-2 py-1 rounded hover:bg-white/5" type="button">Edit</button>
        <button class="px-2 py-1 rounded hover:bg-white/5" type="button">View</button>
        <button class="px-2 py-1 rounded hover:bg-white/5" type="button">Help</button>
      </nav>
      <div class="ml-auto flex items-center gap-2">
        <div class="text-xs text-white/50">Local</div>
        <div class="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
      </div>
    </div>
  </header>
</template>

