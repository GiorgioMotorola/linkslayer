import { ref } from "vue";
import { supabase } from "@/lib/supabase";

const FAKE_DOMAIN = "@dnd-wiki.game";

// Shared reactive user across all useAuth() calls
const user = ref(null);

supabase.auth.getSession().then(({ data: { session } }) => {
  user.value = session?.user ?? null;
});

supabase.auth.onAuthStateChange((_event, session) => {
  user.value = session?.user ?? null;
});

function getUsername(u) {
  return u?.user_metadata?.username ?? u?.email?.split("@")[0] ?? "";
}

export function useAuth() {
  const authLoading = ref(false);

  async function signUp(username, password) {
    const email = username.trim().toLowerCase() + FAKE_DOMAIN;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username.trim() } },
    });
    if (error) throw error;
    return data;
  }

  async function signIn(username, password) {
    const email = username.trim().toLowerCase() + FAKE_DOMAIN;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function updateUsername(newUsername) {
    const name = newUsername.trim();
    const { data, error } = await supabase.auth.updateUser({
      email: name.toLowerCase() + FAKE_DOMAIN,
      data: { username: name },
    });
    if (error) throw error;
    user.value = data.user;
    return data.user;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { user, authLoading, signUp, signIn, signOut, getUsername, updateUsername };
}
