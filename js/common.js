$(function () {
  var page = location.pathname.split('/').pop() || 'index.html';
  $('.navbar-nav .nav-link').each(function () {
    if ($(this).attr('href') === page) {
      $(this).addClass('active');
    }
  });
  $('#year').text(new Date().getFullYear());
});
function loadJSON(url) {
  return fetch(url)
    .then(function (res) {
      if (!res.ok) {
        throw new Error('无法加载 ' + url + '（HTTP ' + res.status + '）');
      }
      return res.json();
    })
    .then(function (data) {
      if (data && data.code && data.code !== 200) {
        throw new Error(data.message || '数据返回异常');
      }
      return data;
    });
}
function showMessage(msg, type) {
  type = type || 'danger';
  if ($('#msg-container').length === 0) {
    $('body').append('<div id="msg-container"></div>');
  }
  var $box = $(
    '<div class="alert alert-' + type + ' alert-dismissible fade show" role="alert">' +
    '<span></span>' +
    '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' +
    '</div>'
  );
  $box.find('span').text(msg);
  $('#msg-container').append($box);
  setTimeout(function () {
    $box.alert('close');
  }, 4000);
}
$(function () {
  $(window).on('error', function (e) {
    var msg = e.originalEvent && e.originalEvent.message;
    if (msg) {
      showMessage('页面脚本运行出错：' + msg, 'danger');
    }
  });
  $(window).on('unhandledrejection', function (e) {
    var reason = e.originalEvent && e.originalEvent.reason;
    var msg = reason && reason.message ? reason.message : String(reason);
    showMessage('异步操作失败：' + msg, 'warning');
  });
});