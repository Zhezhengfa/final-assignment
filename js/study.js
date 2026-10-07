$(function () {
  var allRooms = [];         
  var barChart = null;        
  var pieChart = null;        
  var $building = $('#buildingSelect');
  var $status = $('#statusSelect');
  var $keyword = $('#keywordInput');
  init();
  function init() {
    barChart = echarts.init(document.getElementById('barChart'));
    pieChart = echarts.init(document.getElementById('pieChart'));
    $(window).on('resize', function () {
      barChart.resize();
      pieChart.resize();
    });
    $building.on('change', applyFilters);
    $status.on('change', applyFilters);
    $keyword.on('input', applyFilters);
    $('#resetBtn').on('click', function () {
      $building.val('');
      $status.val('');
      $keyword.val('');
      applyFilters();
    });
    loadData();
  }
  function loadData() {
    showState('loading', '正在加载自习室数据...');
    loadJSON('data/studyrooms.json')
      .then(function (res) {
        allRooms = res.list;
        $('#updateTime').text('数据更新时间：' + res.updateTime);
        initBuildingOptions(allRooms); // 根据数据生成楼栋下拉项
        applyFilters();
      })
      .catch(function (err) {
        showState('error', '数据加载失败：' + err.message +
          '。请确认通过本地服务器（如 Live Server）访问页面。');
        showMessage('自习室数据加载失败：' + err.message, 'danger');
      });
  }
  function initBuildingOptions(rooms) {
    var names = [];
    rooms.forEach(function (r) {
      if (names.indexOf(r.building) === -1) {
        names.push(r.building);
      }
    });
    names.forEach(function (name) {
      $building.append('<option value="' + name + '">' + name + '</option>');
    });
  }
  function applyFilters() {
    var building = $building.val();
    var status = $status.val();
    var keyword = $.trim($keyword.val()).toLowerCase();
    var filtered = allRooms.filter(function (r) {
      if (building && r.building !== building) {
        return false;
      }
      if (status && r.status !== status) {
        return false;
      }
      if (keyword) {
        var text = (r.name + r.building + r.floor).toLowerCase();
        if (text.indexOf(keyword) === -1) {
          return false;
        }
      }
      return true;
    });
    $('#resultCount').text('共找到 ' + filtered.length + ' 间符合条件的自习室');
    renderRooms(filtered);
    renderBarChart(filtered);
    renderPieChart(filtered);
  }
  function renderRooms(rooms) {
    var $list = $('#roomList').empty();
    if (rooms.length === 0) {
      showState('empty', '没有符合条件的自习室，请调整筛选或搜索关键词。');
      return;
    }
    hideState();
    rooms.forEach(function (r) {
      var percent = Math.round((r.used / r.total) * 100);
      var free = r.total - r.used;
      var socketTag = r.socket
        ? '<span class="tag">🔌 有插座</span>'
        : '<span class="tag">无插座</span>';
      var acTag = r.airCondition
        ? '<span class="tag">❄️ 有空调</span>'
        : '<span class="tag">无空调</span>';
      var html =
        '<div class="col-12 col-md-6 col-xl-4">' +
          '<div class="card room-card">' +
            '<div class="card-body">' +
              '<div class="d-flex justify-content-between align-items-start">' +
                '<h6 class="card-title mb-1">' + r.name + '</h6>' +
                '<span class="badge badge-' + r.status + '">' + r.status + '</span>' +
              '</div>' +
              '<p class="text-muted small mb-2">' + r.building + ' · ' + r.floor +
                ' · 🕒 ' + r.openTime + '</p>' +
              '<div class="d-flex justify-content-between small mb-1">' +
                '<span>已用 ' + r.used + ' / ' + r.total + '</span>' +
                '<span class="text-success">空闲 ' + free + ' 座</span>' +
              '</div>' +
              '<div class="progress mb-2">' +
                '<div class="progress-bar bg-warning" style="width:' + percent + '%"></div>' +
              '</div>' +
              socketTag + acTag +
            '</div>' +
          '</div>' +
        '</div>';
      $list.append(html);
    });
  }
  function renderBarChart(rooms) {
    if (rooms.length === 0) {
      barChart.setOption(noDataOption(), true);
      return;
    }
    var names = rooms.map(function (r) { return r.name; });
    var usedData = rooms.map(function (r) { return r.used; });
    var freeData = rooms.map(function (r) { return r.total - r.used; });
    var option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['已用座位', '空闲座位'],
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
        data: names,
        axisLabel: {
          interval: 0,
          rotate: rooms.length > 4 ? 35 : 0,
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        name: '座位数'
      },
      series: [
        {
          name: '已用座位',
          type: 'bar',
          stack: 'total',
          data: usedData,
          barMaxWidth: 38,
          itemStyle: { color: '#f59e0b' }
        },
        {
          name: '空闲座位',
          type: 'bar',
          stack: 'total',
          data: freeData,
          barMaxWidth: 38,
          itemStyle: { color: '#16a34a' }
        }
      ]
    };
    barChart.setOption(option, true);
  }
  function renderPieChart(rooms) {
    if (rooms.length === 0) {
      pieChart.setOption(noDataOption(), true);
      return;
    }
    var groupMap = {};
    rooms.forEach(function (r) {
      groupMap[r.building] = (groupMap[r.building] || 0) + r.total;
    });
    var pieData = Object.keys(groupMap).map(function (key) {
      return { name: key, value: groupMap[key] };
    });
    var option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}：{c} 座（{d}%）'
      },
      legend: {
        bottom: 0
      },
      color: ['#2563eb', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899'],
      series: [
        {
          name: '楼栋座位占比',
          type: 'pie',
          radius: ['40%', '68%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            formatter: '{b}\n{d}%'
          },
          data: pieData
        }
      ]
    };
    pieChart.setOption(option, true);
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
    $('#roomList').hide();
    $('#listState')
      .html('<div class="state-box"><div class="emoji">' + emoji +
            '</div><p class="mt-2 mb-0"></p></div>')
      .find('p').text(msg)
      .end()
      .show();
  }
  function hideState() {
    $('#listState').hide();
    $('#roomList').show();
  }
});