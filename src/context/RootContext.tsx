import { createContext, useContext, useState } from "react";
const RootContext = createContext({});

export const RootContextProvider = ({ children } : any) => {
  const [initialData, setInitialData] = useState({});
  const [userSelection, setUserSelection] = useState();
  const [createProfileState, setCreateProfileState] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [childPage, setChildPage] = useState("");

  return (
    <RootContext.Provider
      value={{        
        userSelection,
        setUserSelection,
        createProfileState,
        setCreateProfileState,
        showLogin,
        setShowLogin,
        childPage,
        setChildPage,   
        initialData,
        setInitialData,
      }}
    >
      {children}
    </RootContext.Provider>
  );
};

export function useRootContext() {
  return useContext(RootContext);
}
