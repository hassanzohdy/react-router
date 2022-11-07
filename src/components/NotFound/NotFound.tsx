import { useEffect } from "react";
import "./NotFound.scss";

export default function NotFound() {
  useEffect(() => {
    document.title = "404 Not Found Page";
    const starContainer: HTMLDivElement = document.querySelector(".stars")!;

    for (let i = 0; i < 100; i++) {
      starContainer.innerHTML += `<div class="star"></div>`;
    }
  }, []);

  return (
    <>
      <div className="not-found-wrapper">
        <div className="text_group">
          <p className="text_404">404</p>
          <p className="text_lost">
            The page you are looking for <br />
            has been lost in space.
          </p>
        </div>
        <div className="window_group">
          <div className="window_404">
            <div className="stars"></div>
          </div>
        </div>
      </div>
    </>
  );
}
