import React, {
  HTMLAttributes,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as echarts from "echarts";
const UseSize = () => {
  const [size, setSize] = useState({
    width:
      typeof window !== "undefined"
        ? window.document.documentElement.clientWidth
        : 0,
    height:
      typeof window !== "undefined"
        ? window.document.documentElement.clientHeight
        : 0,
  });
  const onResize = useCallback(() => {
    setSize({
      width: window.document.documentElement.clientWidth,
      height: window.document.documentElement.clientHeight,
    });
  }, []);
  useEffect(() => {
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });
  return size;
};

const StationChart = (props) => {
  const canvas = useRef(null);
  const chart = useRef();
  let [h, setH] = useState(props.height ?? 400);
  let [w, setW] = useState(props.width ?? 600);
  const size = UseSize();
  useEffect(() => {
    if (canvas.current !== null) {
      if (chart.current !== undefined) {
        echarts.dispose(chart.current);
      }
      chart.current = echarts.init(canvas.current, "dark", {
        renderer: "canvas",
      });
    }
  }, []);
  useEffect(() => {
    const handle = () => {
      const newH =
        props.height ??
        (size.width >= 768
          ? Math.min(size.height, size.width) * 0.4
          : size.width * 0.7);
      const wrapper = canvas.current?.parentElement;

      if (wrapper) {
        const wrapperStyle = window.getComputedStyle(wrapper, null);
        const newW =
          props.width ??
          wrapper.clientWidth -
            parseFloat(wrapperStyle.paddingLeft) -
            parseFloat(wrapperStyle.paddingRight) ??
          600;
        setW(newW);
      }
      setH(newH);
    };
    handle();
  }, [props.height, props.width, size]);

  React.useEffect(() => {
    console.log(chart);
    if (chart.current) {
      chart.current.setOption(props.option ?? {});
    }
  }, [props.option]);
  const darkLoadingStyle = {
    text: "载入中...",
    textColor: "#FFF",
    maskColor: "rgb(24 24 27)",
    zlevel: 0,
    fontSize: 12,
    showSpinner: true,
    spinnerRadius: 10,
    lineWidth: 5,
    fontWeight: "normal",
    fontStyle: "normal",
    fontFamily: "sans-serif",
  };
  const lightLoadingStyle = {
    text: "载入中...",
    maskColor: "#FFF",
    textColor: "rgb(24 24 27)",
    zlevel: 0,
    fontSize: 12,
    showSpinner: true,
    spinnerRadius: 10,
    lineWidth: 5,
    fontWeight: "normal",
    fontStyle: "normal",
    fontFamily: "sans-serif",
  };
  let theme = "auto";
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    theme = darkLoadingStyle;
  }
  if (props.loading) {
    chart.current?.showLoading("default", theme);
  } else {
    chart.current?.hideLoading();
  }

  if (chart.current) {
    chart.current.resize({
      width: typeof w === "number" ? w : "auto",
      height: typeof h === "number" ? h : "auto",
    });
  }
  return (
    <div
      style={{
        width: w,
        height: h,
        ...props.style,
        transform: "tranzinc3d(0, 0, 0)",
      }}
      ref={canvas}
    />
  );
};
export default StationChart;
