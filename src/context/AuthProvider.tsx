import { createContext, useContext, useState } from "react";

const AuthContext = createContext({});

export const AuthProvider = ({ children }: any) => {
  const [error, setError] = useState(false);
  const [isExpand, setIsExpand] = useState(false);
  const [initialData, setInitialData] = useState({});
  return (
    <AuthContext.Provider
      value={{
        initialData,
        setInitialData,
        isExpand,
        setIsExpand,
        error,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useUserAuth() {
  return useContext(AuthContext);
}
