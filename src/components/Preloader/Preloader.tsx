import { useEffect, useRef, useState } from "react";
import classes from "./Preloader.module.scss";

export default function Preloader({ loading }: { loading: boolean }) {
  // create a progress state to show the progress of the loading
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<any>();

  useEffect(() => {
    if (!loading) {
      progressRef.current.style.display = "none";
      progressRef.current.style.width = "0";
      setProgress(0);
      return;
    }
    // create an interval to be updated every 100ms
    const interval = setInterval(() => {
      progressRef.current.style.display = "block";
      // update the progress state by 10
      setProgress(progress + 10);

      // update the progress bar width
      progressRef.current.style.width = `${progress}%`;
    }, 100);

    // clear the interval when the progress state is 100

    if (progress === 100) {
      // update the progress bar width
      progressRef.current.style.width = `${progress}%`;

      clearInterval(interval);
    }

    // return a function to clear the interval when the component is unmounted
    return () => {
      clearInterval(interval);
    };
  }, [progress, loading]);

  return (
    <div className={classes.root}>
      <div className={classes.progressWrapper}>
        <div ref={progressRef} className={classes.progress} />
      </div>
    </div>
  );
}
