// hooks/useFleetAI.ts
import { useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

interface FleetAIRequest {
  query: string;
  weather?: string; // weather sẽ được truyền từ component
}

interface FleetAIResponse {
  insight: string;
  timestamp?: string;
  [key: string]: any;
}

export const useFleetAI = () => {
  return useMutation<FleetAIResponse, Error, FleetAIRequest>({
    mutationFn: async ({ query, weather = "Clear" }) => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("No active session. Please login again.");
      }

      const { data, error } = await supabase.functions.invoke("smart-handler", {
        body: {
          query,
          weather, // Truyền weather thực tế vào
        },
      });

      if (error) {
        console.error("FleetAI Edge Function error:", error);
        throw new Error(error.message || "Failed to invoke Fleet AI Agent");
      }

      return data as FleetAIResponse;
    },
  });
};
