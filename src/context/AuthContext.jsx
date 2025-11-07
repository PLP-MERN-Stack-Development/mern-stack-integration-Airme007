import { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "@/integrations/mongodb/client";
import { useToast } from "@/hooks/use-toast";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing token and validate user
    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, you might want to validate the token with the server
      // For now, we'll assume it's valid if it exists
      setUser({ token });
    }
    setLoading(false);
  }, []);

  const signUp = async (email, password, username) => {
    try {
      const response = await apiClient.signUp(email, password, username);
      localStorage.setItem('token', response.token);
      setUser({ id: response.user.id, username: response.user.username, email: response.user.email });
      toast({
        title: "Account created!",
        description: "You can now sign in with your credentials.",
      });
      return { error: null };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message,
      });
      return { error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const response = await apiClient.signIn(email, password);
      localStorage.setItem('token', response.token);
      setUser(response.user);
      toast({
        title: "Signed in successfully",
        description: `Welcome back, ${response.user.username}!`,
      });
      return { error: null };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message,
      });
      return { error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    setUser(null);
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
