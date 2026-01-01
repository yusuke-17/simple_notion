<script lang="ts">
  import { authStore } from '$lib/stores/auth.svelte'
  import Button from '$lib/components/ui/button.svelte'
  import Input from '$lib/components/ui/input.svelte'

  // Svelte 5のRunesを使用した状態管理
  let email = $state('')
  let password = $state('')
  let name = $state('')
  let error = $state('')
  let isRegisterMode = $state(false)

  /**
   * フォーム送信処理
   */
  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (authStore.loading) return

    error = ''

    try {
      if (isRegisterMode) {
        await authStore.register(email, password, name)
      } else {
        await authStore.login(email, password)
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred'
    }
  }

  /**
   * モード切り替え
   */
  function toggleMode() {
    isRegisterMode = !isRegisterMode
    error = ''
  }
</script>

<div
  class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
>
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
      {isRegisterMode ? 'Create your account' : 'Sign in to your account'}
    </h2>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <form class="space-y-6" onsubmit={handleSubmit}>
        {#if isRegisterMode}
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">
              Name
            </label>
            <div class="mt-1">
              <Input
                id="name"
                name="name"
                type="text"
                required
                bind:value={name}
                class="w-full"
              />
            </div>
          </div>
        {/if}

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div class="mt-1">
            <Input
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              bind:value={email}
              class="w-full"
            />
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div class="mt-1">
            <Input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              bind:value={password}
              class="w-full"
            />
          </div>
        </div>

        {#if error}
          <div class="text-red-600 text-sm text-center">
            {error}
          </div>
        {/if}

        <div>
          <Button type="submit" disabled={authStore.loading} class="w-full">
            {#if authStore.loading}
              <span>Loading...</span>
            {:else}
              <span>{isRegisterMode ? 'Register' : 'Sign in'}</span>
            {/if}
          </Button>
        </div>

        <div class="text-center">
          <button
            type="button"
            onclick={toggleMode}
            class="text-indigo-600 hover:text-indigo-500 text-sm"
          >
            {isRegisterMode
              ? 'Already have an account? Sign in'
              : "Don't have an account? Register"}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
