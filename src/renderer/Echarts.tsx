import React, { HTMLAttributes, useEffect, useRef, useState } from 'react';
import { EChartsOption, ECharts, dispose, init } from 'echarts';
import * as echarts from 'echarts/core';
import dark from './themes/dark.project.json';
import light from './themes/light.project.json';
import { getLoadingTheme } from './getLoadingTheme';
import { UseSize } from './UseSize';

echarts.registerTheme('dark', dark);
echarts.registerTheme('light', light);

type StationChartProps = {
  height?: number | string | undefined;
  width?: number | string | undefined;
  style?: HTMLAttributes<HTMLDivElement>['style'];
  option?: EChartsOption;
  theme?: 'dark' | 'light';
  loading?: boolean;
};

function EchartsComponent({
  height,
  width,
  option,
  style,
  theme,
  loading,
}: StationChartProps): JSX.Element {
  const canvas = useRef<HTMLDivElement>(null);
  const chart = useRef<ECharts>();

  const [h, setH] = useState<string | number>(height ?? 400);
  const [w, setW] = useState<string | number>(width ?? 600);
  const size = UseSize();

  if (loading && !option) {
    if (chart.current) {
      chart.current?.showLoading('default', getLoadingTheme());
    }
  } else {
    chart.current?.hideLoading();
    chart.current?.resize(size);
  }

  useEffect(() => {
    if (canvas.current !== null) {
      if (chart.current !== undefined) {
        dispose(chart.current);
      }
      chart.current = init(canvas.current, theme, {
        renderer: 'canvas',
      });
    }
  }, [theme]);

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
      // chart.current.resize();
    }
  }, [option]);

  if (chart.current) {
    chart.current.resize({
      width:
        typeof w === 'number'
          ? Math.min(w, window.document.documentElement.clientWidth)
          : 'auto',
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
  style: {} as HTMLAttributes<HTMLDivElement>['style'],
  option: undefined,
  loading: false,
  theme: 'light',
};
export default EchartsComponent;
