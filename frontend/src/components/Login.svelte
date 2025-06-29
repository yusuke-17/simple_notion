<script lang="ts">
  import { authService } from '../stores/auth';
  
  let email = $state('');
  let password = $state('');
  let name = $state('');
  let isLoading = $state(false);
  let error = $state('');
  let isRegisterMode = $state(false);
  
  async function handleSubmit() {
    if (isLoading) return;
    
    isLoading = true;
    error = '';
    
    try {
      if (isRegisterMode) {
        await authService.register(email, password, name);
      } else {
        await authService.login(email, password);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
      {isRegisterMode ? 'Create your account' : 'Sign in to your account'}
    </h2>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <form class="space-y-6" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        {#if isRegisterMode}
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
            <div class="mt-1">
              <input
                id="name"
                name="name"
                type="text"
                required
                bind:value={name}
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        {/if}

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
          <div class="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              required
              bind:value={email}
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
          <div class="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              required
              bind:value={password}
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {#if error}
          <div class="text-red-600 text-sm">{error}</div>
        {/if}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : (isRegisterMode ? 'Sign up' : 'Sign in')}
          </button>
        </div>
      </form>

      <div class="mt-6">
        <button
          onclick={() => isRegisterMode = !isRegisterMode}
          class="w-full text-center text-sm text-blue-600 hover:text-blue-500"
        >
          {isRegisterMode ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  </div>
</div>
