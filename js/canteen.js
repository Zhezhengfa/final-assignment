$(function () {
  var allCanteens = [];    
  var hourLabels = [];     
  var selectedTags = [];   
  var lineChart = null;    
  var barChart = null;     
  var $location = $('#locationSelect');
  var $keyword = $('#keywordInput');
  init();
  function init() {
    lineChart = echarts.init(document.getElementById('lineChart'));
    barChart = echarts.init(document.getElementById('barChart'));
    $(window).on('resize', function () {
      lineChart.resize();
      barChart.resize();
    });
    $location.on('change', applyFilters);
    $keyword.on('input', applyFilters);
    $('#resetBtn').on('click', function () {
      $location.val('');
      $keyword.val('');
      selectedTags = [];
      $('#tagGroup .tag-btn').removeClass('active');
      applyFilters();
    });
    loadData();
  }
  function loadData() {
    showState('loading', '正在加载食堂数据...');
    loadJSON('data/canteens.json')
      .then(function (res) {
        allCanteens = res.list;
        hourLabels = res.hourLabels;
        $('#updateTime').text('数据更新时间：' + res.updateTime);
        initLocationOptions(allCanteens);
        initTagButtons(allCanteens);
        applyFilters();
      })
      .catch(function (err) {
        showState('error', '数据加载失败：' + err.message +
          '。请确认通过本地服务器（如 Live Server）访问页面。');
        showMessage('食堂数据加载失败：' + err.message, 'danger');
      });
  }
  function initLocationOptions(list) {
    var areas = [];
    list.forEach(function (c) {
      if (areas.indexOf(c.location) === -1) {
        areas.push(c.location);
      }
    });
    areas.forEach(function (area) {
      $location.append('<option value="' + area + '">' + area + '</option>');
    });
  }
  function initTagButtons(list) {
    var tags = [];
    list.forEach(function (c) {
      c.tags.forEach(function (t) {
        if (tags.indexOf(t) === -1) {
          tags.push(t);
        }
      });
    });
    var $group = $('#tagGroup').empty();
    tags.forEach(function (t) {
      var $btn = $('<button type="button" class="btn btn-outline-primary btn-sm tag-btn"></button>')
        .text(t);
      $btn.on('click', function () {
        var idx = selectedTags.indexOf(t);
        if (idx === -1) {
          selectedTags.push(t);
          $(this).addClass('active');
        } else {
          selectedTags.splice(idx, 1);
          $(this).removeClass('active');
        }
        applyFilters();
      });
      $group.append($btn);
    });
  }
  function applyFilters() {
    var location = $location.val();
    var keyword = $.trim($keyword.val()).toLowerCase();
    var filtered = allCanteens.filter(function (c) {
      if (location && c.location !== location) {
        return false;
      }
      if (selectedTags.length > 0) {
        var hit = selectedTags.some(function (t) {
          return c.tags.indexOf(t) !== -1;
        });
        if (!hit) {
          return false;
        }
      }
      if (keyword) {
        var text = (c.name + c.tags.join('')).toLowerCase();
        if (text.indexOf(keyword) === -1) {
          return false;
        }
      }
      return true;
    });
    $('#resultCount').text('共找到 ' + filtered.length + ' 家符合条件的食堂');
    renderCanteens(filtered);
    renderLineChart(filtered);
    renderBarChart(filtered);
  }
  function renderCanteens(list) {
    var $box = $('#canteenList').empty();
    if (list.length === 0) {
      showState('empty', '没有符合条件的食堂，请调整筛选或搜索关键词。');
      return;
    }
    hideState();
    list.forEach(function (c) {
      var dishTags = c.tags.map(function (t) {
        return '<span class="dish-tag">' + t + '</span>';
      }).join('');
      var html =
        '<div class="col-12 col-md-6 col-xl-4">' +
          '<div class="card canteen-card">' +
            '<div class="card-body">' +
              '<div class="d-flex justify-content-between align-items-start">' +
                '<h5 class="card-title mb-1">' + c.name + '</h5>' +
                '<span class="badge badge-' + c.level + '">' + c.level + '</span>' +
              '</div>' +
              '<p class="text-muted small mb-2">位于' + c.location + ' · ' +
                c.windows + ' 个窗口</p>' +
              '<p class="mb-2">' +
                '<span class="stars">' + buildStars(c.rating) + '</span> ' +
                '<span class="small">' + c.rating.toFixed(1) + ' 分</span>' +
                '<span class="text-muted small ms-2">人均约 ¥' + c.avgPrice + '</span>' +
              '</p>' +
              dishTags +
            '</div>' +
          '</div>' +
        '</div>';
      $box.append(html);
    });
  }
  function renderLineChart(list) {
    if (list.length === 0) {
      lineChart.setOption(noDataOption(), true);
      return;
    }
    var series = list.map(function (c) {
      return {
        name: c.name,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: c.hourly
      };
    });
    var option = {
      color: ['#2563eb', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899'],
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        type: 'scroll',
        top: 0
      },
      grid: {
        left: 8,
        right: 8,
        bottom: 8,
        top: 40,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: hourLabels
      },
      yAxis: {
        type: 'value',
        name: '人数'
      },
      series: series
    };
    lineChart.setOption(option, true);
  }
  function renderBarChart(list) {
    if (list.length === 0) {
      barChart.setOption(noDataOption(), true);
      return;
    }
    var sorted = list.slice().sort(function (a, b) {
      return a.avgPrice - b.avgPrice;
    });
    var names = sorted.map(function (c) { return c.name; });
    var prices = sorted.map(function (c) {
      return {
        value: c.avgPrice,
        rating: c.rating
      };
    });
    var option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function (params) {
          var p = params[0];
          return p.name + '<br/>人均消费：¥' + p.value +
            '<br/>评分：' + p.data.rating.toFixed(1) + ' 分';
        }
      },
      grid: {
        left: 8,
        right: 40,
        bottom: 8,
        top: 16,
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: '元'
      },
      yAxis: {
        type: 'category',
        data: names
      },
      series: [
        {
          name: '人均消费',
          type: 'bar',
          data: prices,
          barMaxWidth: 26,
          itemStyle: {
            color: '#2563eb',
            borderRadius: [0, 6, 6, 0]
          },
          label: {
            show: true,
            position: 'right',
            formatter: '¥{c}'
          }
        }
      ]
    };
    barChart.setOption(option, true);
  }
  function buildStars(rating) {
    var full = Math.round(rating); // 四舍五入取整星数量
    var str = '';
    for (var i = 0; i < 5; i++) {
      str += i < full ? '★' : '☆';
    }
    return str;
  }
  function noDataOption() {
    return {
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        textStyle: {
          color: '#9ca3af',
          fontSize: 14,
          fontWeight: 'normal'
        }
      }
    };
  }
  function showState(type, msg) {
    var emoji = '🔍';
    if (type === 'loading') {
      emoji = '⏳';
    } else if (type === 'error') {
      emoji = '⚠️';
    }
    $('#canteenList').hide();
    $('#listState')
      .html('<div class="state-box"><div class="emoji">' + emoji +
            '</div><p class="mt-2 mb-0"></p></div>')
      .find('p').text(msg)
      .end()
      .show();
  }
  function hideState() {
    $('#listState').hide();
    $('#canteenList').show();
  }
});