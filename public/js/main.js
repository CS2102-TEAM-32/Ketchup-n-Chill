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

$('.date-input')
  .on('change', function() {
    this.setAttribute(
      'data-date',
      moment(this.value, 'YYYY-MM-DD').format(
        this.getAttribute('data-date-format')
      )
    );
  })
  .trigger('change');
