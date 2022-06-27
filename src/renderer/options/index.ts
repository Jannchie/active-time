import { extent, range, rollup, sum, union } from 'd3-array';
import { timeFormat } from 'd3-time-format';

export const getPieOptions = (
  source: any[],
  groupby: string,
  top = 5
): echarts.EChartsOption | undefined => {
  if (!source) {
    return undefined;
  }
  const rawData = Array.from(
    rollup(
      source,
      (d) => {
        return { name: d[0][groupby], value: sum(d, (v) => v.seconds) };
      },
      (d) => d[groupby]
    ).values()
  ).sort((a, b) => b.value - a.value);
  const data = rawData.slice(0, top);
  const other = rawData.slice(top).reduce(
    (acc, cur) => {
      acc.value += cur.value;
      return acc;
    },
    { name: 'other', value: 0 }
  );
  if (other.value !== 0) {
    data.push(other);
  }
  const result: echarts.EChartsOption = {
    tooltip: {},
    series: {
      type: 'pie',
      radius: ['20%', '80%'],
      roseType: 'radius',
      minAngle: 20,
      data,
    },
  };
  return result;
};

export const getHistoryStackBarOptions = (
  source: any[]
): echarts.EChartsOption | undefined => {
  if (!source) {
    return undefined;
  }
  const data = rollup(
    source,
    (d) => sum(d, (v) => v.seconds),
    (d) => d.program,
    (d) => d.timestamp
  );
  const [minTs, maxTs] = extent(source, (v) => new Date(v.timestamp).getTime());
  const tf = timeFormat('%Y-%m-%d %H:%M');
  const temp = [...union(source.map((v) => new Date(v.timestamp)))].sort(
    (a, b) => a.getTime() - b.getTime()
  );
  let gap = 99999999999999;
  if (temp.length > 1) {
    for (let i = 1; i < temp.length; i += 1) {
      gap = Math.min(temp[i].getTime() - temp[i - 1].getTime(), gap);
    }
  } else {
    gap = 1;
  }
  if (maxTs) {
    const timestamps = range(minTs, maxTs + 1, gap).map((d) => tf(new Date(d)));
    const series = [...data].map(([key, vMap], i) => {
      const d = [...vMap.entries()].map((v): [any, number] => {
        return [tf(new Date(v[0])), v[1]];
      });
      return {
        type: 'bar',
        name: key,
        stack: 'total',
        data: d,
        showBackground: true,
        animationDelay: (idx: number) => idx * 10 + 200 * i,
      } as any;
    });
    const result: echarts.EChartsOption = {
      xAxis: {
        type: 'category',
        data: timestamps,
      },
      yAxis: { type: 'value', max: gap === 1 ? 'max' : gap / 1000 },
      tooltip: {},
      series,
      animationEasing: 'elasticOut',
      animationDelayUpdate: (idx) => {
        return idx * 5;
      },
    };
    return result;
  }
  return undefined;
};
