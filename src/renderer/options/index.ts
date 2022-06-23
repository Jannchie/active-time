import { extent, range, rollup, sum } from 'd3-array';
import { timeFormat } from 'd3-time-format';

export const getPieOpitons = (
  source: any[],
  groupby: string
): echarts.EChartsOption => {
  if (!source) {
    return {};
  }
  const data = Array.from(
    rollup(
      source,
      (d) => {
        return { name: d[0][groupby], value: sum(d, (v) => v.seconds) };
      },
      (d) => d[groupby]
    ).values()
  );
  const result: echarts.EChartsOption = {
    tooltip: {},
    series: {
      type: 'pie',
      radius: ['20%', '80%'],
      roseType: 'radius',
      data,
    },
  };
  return result;
};

export const getMinutesHistory = (source: any[]) => {
  if (!source) {
    return {};
  }
  const data = rollup(
    source,
    (d) => sum(d, (v) => v.seconds),
    (d) => d.program,
    (d) => d.timestamp
  );
  const [minTs, maxTs] = extent(source, (v) => new Date(v.timestamp).getTime());
  const tf = timeFormat('%Y-%m-%d %H:%M');
  if (maxTs) {
    const timestamps = range(minTs, maxTs + 1, 1000 * 60).map((d) =>
      tf(new Date(d))
    );
    const series = [...data].map(([key, vMap]) => {
      const d = [...vMap.entries()].map((v): [any, number] => {
        return [tf(new Date(v[0])), v[1]];
      });
      return {
        type: 'bar',
        name: key,
        stack: 'total',
        data: d,
        showBackground: true,
      } as any;
    });
    const result: echarts.EChartsOption = {
      xAxis: {
        type: 'category',
        data: timestamps,
      },
      yAxis: { type: 'value', max: 60 },
      tooltip: {},
      series,
    };
    return result;
  }
  return {};
};
