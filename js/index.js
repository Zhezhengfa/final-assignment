$(function () {
  Promise.all([
    loadJSON('data/studyrooms.json'),
    loadJSON('data/canteens.json')
  ])
    .then(function (results) {
      var rooms = results[0].list;
      var canteens = results[1].list;
      var freeSeats = rooms.reduce(function (sum, r) {
        return sum + (r.total - r.used);
      }, 0);
      var windowCount = canteens.reduce(function (sum, c) {
        return sum + c.windows;
      }, 0);

      $('#roomCount').text(rooms.length);
      $('#freeSeats').text(freeSeats);
      $('#canteenCount').text(canteens.length);
      $('#windowCount').text(windowCount);
      $('#updateTime').text('数据更新时间：' + results[0].updateTime);
    })
    .catch(function (err) {
      $('.stat-value').text('--');
      $('#updateTime').text('数据暂时不可用');
      showMessage('首页数据加载失败：' + err.message +
        '。如用 file:// 方式打开页面会被浏览器拦截，请使用本地服务器（如 VS Code Live Server）。');
    });
});