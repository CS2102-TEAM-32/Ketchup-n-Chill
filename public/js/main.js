$(document).ready(() => {
  $('.delete-diner').on('click', e => {
    const usr = $(e.target).attr('usr');
    $.ajax({
      type: 'DELETE',
      url: '/diners/' + usr,
      success: () => {
        window.location.href = '/diners';
      },
      error: err => {
        console.log(err);
      }
    });
  });
});
