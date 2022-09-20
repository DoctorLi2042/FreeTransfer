import React from "react";
import ReactDOM from "react-dom/client";
import MainProvider from "./libs/mainProvider";
import './styles/global.scss'

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <MainProvider/>
  </React.StrictMode>
);
