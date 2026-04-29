import { Show } from "solid-js";
import "./preloader.css";

type PreloaderSplashProps = {
  visible: boolean;
};

export default function PreloaderSplash(props: PreloaderSplashProps) {
  return (
    <Show when={props.visible}>
      <div class="tshaped-preloader" role="status" aria-live="polite" aria-label="Loading T-Shaped tool">
        <div class="tshaped-preloader__logo">T-Shaped</div>
        <div class="tshaped-preloader__bars" aria-hidden="true">
          <span class="tbar"></span>
          <span class="tbar"></span>
          <span class="tbar"></span>
          <span class="tbar"></span>
          <span class="tbar"></span>
          <span class="tbar"></span>
          <span class="tbar"></span>
          <span class="tbar"></span>
          <span class="tbar"></span>
          <span class="tbar"></span>
          <span class="tbar"></span>
        </div>
      </div>
    </Show>
  );
}
