import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store, { authPersist } from "./redux/Store.jsx";
import { PersistGate } from "redux-persist/integration/react";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={authPersist}>
        <BrowserRouter>
          <App />
        </BrowserRouter>  
      </PersistGate> 
    </Provider> 
  </StrictMode>
);
