// assets/charts.js
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: 南山一经山系路线里程图 ---
  var chart1 = echarts.init(document.getElementById('chart-route'), null, { renderer: 'svg' });
  chart1.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      formatter: function(params) {
        var p = params[0];
        return '<strong>' + p.name + '</strong><br/>与前一山相距：' + p.value + ' 里<br/>累计里程：' + p.data.acc + ' 里';
      }
    },
    grid: { left: 80, right: 40, top: 30, bottom: 60 },
    xAxis: {
      type: 'category',
      data: ['招摇山\n（起点）', '堂庭山', '猿翼山', '杻阳山', '柢山', '亶爰山', '基山', '青丘山', '箕尾山\n（终点）'],
      axisLabel: { color: muted, fontSize: 11, interval: 0 },
      axisLine: { lineStyle: { color: rule } },
      axisTick: { alignWithLabel: true }
    },
    yAxis: {
      type: 'value',
      name: '里程（里）',
      nameTextStyle: { color: muted },
      axisLabel: { color: muted },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    },
    series: [{
      type: 'bar',
      data: [
        { value: 0, itemStyle: { color: accent2 }, acc: 0 },
        { value: 300, itemStyle: { color: accent }, acc: 300 },
        { value: 380, itemStyle: { color: accent }, acc: 680 },
        { value: 370, itemStyle: { color: accent }, acc: 1050 },
        { value: 300, itemStyle: { color: '#b22234' }, acc: 1350 },
        { value: 300, itemStyle: { color: accent }, acc: 1650 },
        { value: 300, itemStyle: { color: accent }, acc: 1950 },
        { value: 300, itemStyle: { color: accent }, acc: 2250 },
        { value: 350, itemStyle: { color: accent2 }, acc: 2600 }
      ],
      barWidth: '60%',
      label: {
        show: true,
        position: 'top',
        color: muted,
        fontSize: 10,
        formatter: function(p) {
          return p.value > 0 ? p.value + '里' : '起点';
        }
      }
    }]
  });
  window.addEventListener('resize', function() { chart1.resize(); });

  // --- Chart: 柢山位置示意（南山一经东西向示意） ---
  var chart2 = echarts.init(document.getElementById('chart-profile'), null, { renderer: 'svg' });
  chart2.setOption({
    animation: false,
    tooltip: { trigger: 'item', appendToBody: true },
    grid: { left: 60, right: 30, top: 30, bottom: 40 },
    xAxis: {
      type: 'category',
      data: ['西\n广西猫儿山\n(招摇山)', '→', '→', '柢山\n(广东中北部)', '→', '→', '东\n福建沿海\n(箕尾山)'],
      axisLabel: { color: muted, fontSize: 11, interval: 0 },
      axisLine: { lineStyle: { color: rule } }
    },
    yAxis: {
      type: 'value',
      name: '示意高程',
      nameTextStyle: { color: muted },
      axisLabel: { show: false },
      splitLine: { show: false },
      min: 0,
      max: 120
    },
    series: [{
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 10,
      lineStyle: { color: accent, width: 3 },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: accent + '44' },
            { offset: 1, color: accent + '11' }
          ]
        }
      },
      data: [
        { value: 80, itemStyle: { color: accent2 } },
        { value: 60, itemStyle: { color: muted } },
        { value: 70, itemStyle: { color: muted } },
        { value: 50, itemStyle: { color: '#b22234' } },
        { value: 60, itemStyle: { color: muted } },
        { value: 40, itemStyle: { color: muted } },
        { value: 10, itemStyle: { color: accent2 } }
      ],
      label: {
        show: true,
        position: 'top',
        color: ink,
        fontSize: 11,
        formatter: function(p) {
          return p.name.indexOf('柢山') >= 0 ? '★ 柢山' : '';
        }
      }
    }]
  });
  window.addEventListener('resize', function() { chart2.resize(); });
})();
