// src/composables/useAuth.js
import { ref } from "vue";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const user = ref(null);
  const authLoading = ref(true);

  supabase.auth.getSession().then(({ data: { session } }) => {
    user.value = session?.user ?? null;
    authLoading.value = false;
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null;
  });

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { user, authLoading, signUp, signIn, signOut };
}
