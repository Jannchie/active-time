import React, {
  HTMLAttributes,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { EChartsOption, ECharts, dispose, init } from 'echarts';

const UseSize = () => {
  const [size, setSize] = useState({
    width:
      typeof window !== 'undefined'
        ? window.document.documentElement.clientWidth
        : 0,
    height:
      typeof window !== 'undefined'
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
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });
  return size;
};
type StationChartProps = {
  height?: number | string | undefined;
  width?: number | string | undefined;
  style?: HTMLAttributes<HTMLDivElement>['style'];
  option?: EChartsOption;
  loading?: boolean;
};

function EchartsComponent({
  height,
  width,
  option,
  style,
  loading,
}: StationChartProps): JSX.Element {
  const canvas = useRef<HTMLDivElement>(null);
  const chart = useRef<ECharts>();
  const [h, setH] = useState<string | number>(height ?? 400);
  const [w, setW] = useState<string | number>(width ?? 600);
  const size = UseSize();
  useEffect(() => {
    if (canvas.current !== null) {
      if (chart.current !== undefined) {
        dispose(chart.current);
      }
      chart.current = init(canvas.current, 'dark', {
        renderer: 'canvas',
      });
    }
  }, []);
  useEffect(() => {
    const handle = () => {
      const newH =
        height ??
        (size.width >= 768
          ? Math.min(size.height, size.width) * 0.4
          : size.width * 0.7);
      const wrapper = canvas.current?.parentElement;
      if (wrapper) {
        const wrapperStyle = window.getComputedStyle(wrapper, null);
        const newW =
          width ??
          wrapper.clientWidth -
            parseFloat(wrapperStyle.paddingLeft) -
            parseFloat(wrapperStyle.paddingRight) ??
          600;
        setW(newW);
      }
      setH(newH);
    };
    handle();
  }, [height, width, size]);

  React.useEffect(() => {
    if (chart.current) {
      chart.current.setOption(option ?? {});
    }
  }, [option]);
  const darkLoadingStyle = {
    text: '载入中...',
    textColor: '#FFF',
    maskColor: 'rgb(24 24 27)',
    zlevel: 0,
    fontSize: 12,
    showSpinner: true,
    spinnerRadius: 10,
    lineWidth: 5,
    fontWeight: 'normal',
    fontStyle: 'normal',
    fontFamily: 'sans-serif',
  };
  const lightLoadingStyle = {
    text: '载入中...',
    maskColor: '#FFF',
    textColor: 'rgb(24 24 27)',
    zlevel: 0,
    fontSize: 12,
    showSpinner: true,
    spinnerRadius: 10,
    lineWidth: 5,
    fontWeight: 'normal',
    fontStyle: 'normal',
    fontFamily: 'sans-serif',
  };
  let theme = lightLoadingStyle;
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    theme = darkLoadingStyle;
  }
  if (loading) {
    chart.current?.showLoading('default', theme);
  } else {
    chart.current?.hideLoading();
  }

  if (chart.current) {
    chart.current.resize({
      width: typeof w === 'number' ? w : 'auto',
      height: typeof h === 'number' ? h : 'auto',
    });
  }
  return (
    <div
      style={{
        ...style,
        width: w,
        height: h,
        transform: 'tranzinc3d(0, 0, 0)',
      }}
      ref={canvas}
    />
  );
}
EchartsComponent.defaultProps = {
  height: undefined,
  width: undefined,
  style: {},
  option: {} as HTMLAttributes<HTMLDivElement>['style'],
  loading: false,
};
export default EchartsComponent;
