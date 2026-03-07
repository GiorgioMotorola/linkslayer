<template>
  <div class="auth-overlay">
    <div class="auth-modal">

      <div class="auth-icon">⚔️</div>
      <div class="auth-title">{{ isSignUp ? "Create Account" : "Welcome Back" }}</div>

      <div v-if="confirmed" class="auth-message auth-success">
        Account created. Check your email to confirm, then sign in.
      </div>

      <template v-else>
        <div class="auth-fields">
          <div class="auth-field">
            <label>Email</label>
            <input
              v-model="email"
              type="email"
              placeholder="your@email.com"
              autocomplete="email"
              @keyup.enter="submit"
            />
          </div>
          <div class="auth-field">
            <label>Password</label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
              @keyup.enter="submit"
            />
          </div>
        </div>

        <div v-if="errorMsg" class="auth-message auth-error">{{ errorMsg }}</div>

        <button class="auth-submit" @click="submit" :disabled="loading">
          {{ loading ? "..." : isSignUp ? "Create Account" : "Sign In" }}
        </button>

        <button class="auth-toggle" @click="toggleMode">
          {{ isSignUp ? "Already have an account? Sign in" : "No account? Create one" }}
        </button>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import "./styles/authModalStyles.css";

const props = defineProps({
  signIn: Function,
  signUp: Function,
});

const emit = defineEmits(["authenticated"]);

const isSignUp = ref(false);
const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMsg = ref("");
const confirmed = ref(false);

function toggleMode() {
  isSignUp.value = !isSignUp.value;
  errorMsg.value = "";
}

async function submit() {
  if (!email.value || !password.value) {
    errorMsg.value = "Please enter your email and password.";
    return;
  }
  loading.value = true;
  errorMsg.value = "";
  try {
    if (isSignUp.value) {
      const data = await props.signUp(email.value, password.value);
      if (data.session) {
        emit("authenticated");
      } else {
        confirmed.value = true;
      }
    } else {
      await props.signIn(email.value, password.value);
      emit("authenticated");
    }
  } catch (err) {
    errorMsg.value = err.message ?? "Something went wrong.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
* {
  font-family: "IBM Plex Sans", sans-serif;
}
</style>
