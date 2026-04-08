"use client";

import { createContext, useContext, useState } from "react";
import { Interview } from "@/lib/api/interview";

type ContextType = {
  interviews: Interview[];
  setInterviews: React.Dispatch<React.SetStateAction<Interview[]>>;
};

const InterviewContext = createContext<ContextType | null>(null);

export const InterviewProvider = ({ children }: any) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);

  return (
    <InterviewContext.Provider value={{ interviews, setInterviews }}>
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = () => {
  const ctx = useContext(InterviewContext);
  if (!ctx) throw new Error("useInterview must be used inside provider");
  return ctx;
};
