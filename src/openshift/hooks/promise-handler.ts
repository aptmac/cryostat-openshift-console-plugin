// This hook is not exported by 
// https://github.com/openshift/console/blob/main/frontend/packages/console-shared/src/hooks/promise-handler.ts
import * as React from 'react';

export const usePromiseHandler: PromiseHandlerHook = <T = unknown>() => {
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const handlePromise: PromiseHandlerCallback<T> = (promise) => {
    setInProgress(true);
    return promise
      .then((res) => {
        setErrorMessage('');
        return res;
      })
      .catch((error) => {
        setErrorMessage(error.toString?.() || 'An error occurred. Please try again.');
        return Promise.reject(error);
      })
      .finally(() => setInProgress(false));
  };
  return [handlePromise, inProgress, errorMessage];
};

type PromiseHandlerCallback<T> = (promise: Promise<T>) => Promise<T>;
type PromiseHandlerHook = <T>() => [PromiseHandlerCallback<T>, boolean, string];
