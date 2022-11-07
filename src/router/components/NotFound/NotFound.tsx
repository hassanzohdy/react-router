import { useEffect } from "react";
import classes from "./NotFound.module.scss";

export default function NotFound() {
  useEffect(() => {
    document.title = "404 Not Found Page";
    const starContainer: HTMLDivElement = document.querySelector(".stars")!;

    for (let i = 0; i < 100; i++) {
      starContainer.innerHTML += `<div class="${classes.star}"></div>`;
    }
  }, []);

  return (
    <>
      <div className={classes.root}>
        <div className={classes.text_group}>
          <p className={classes.text_404}>404</p>
          <p className={classes.text_lost}>
            The page you are looking for <br />
            has been lost in space.
          </p>
        </div>
        <div className={classes.window_group}>
          <div className={classes.window_404}>
            <div className={classes.stars + " stars"}></div>
          </div>
        </div>
      </div>
    </>
  );
}
