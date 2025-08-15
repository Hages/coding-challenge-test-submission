import React, { FunctionComponent } from "react";

import $ from "./ErrorMessage.module.css";

interface ErrorMessageProps {
  error: string;
}

const ErrorMessage: FunctionComponent<ErrorMessageProps> = ({ error }) => {
  return <div className={$.error}>{error}</div>;
};

export default ErrorMessage;
