$(document).ready(() => {
  $('.delete-diner').on('click', e => {
    $.ajax({
      type: 'DELETE',
      url: '/diners/',
      success: () => {
        window.location.href = '/diners';
      },
      error: err => {
        console.log(err);
      }
    });
  });
});

$(document).ready(() => {
  $('#delete-menu').on('click', e => {
    console.log('clicked');
    const title = $(e.target).attr('title');
    const raddress = $(e.target).attr('raddress');
    const rname = $(e.target).attr('rname');
    $.ajax({
      type: 'DELETE',
      url: '/menus/' + rname + '/' + raddress + '/' + title,
      success: () => {
        window.location.href = '/home';
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

$(document).ready(() => {
  $('#addMore').on('click', e => {
    e.preventDefault();
    $('#fieldList').append('<li>&nbsp;</li>');
    $('#fieldList').append(
      '<li><input type=text name="item" placeholder="item" /></li>'
    );
    $('#fieldList').append(
      '<li><input type=text name="price" placeholder="price" /></li>'
    );
  });
});
