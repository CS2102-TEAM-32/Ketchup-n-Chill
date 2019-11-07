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
  $('.mark-reservation-complete').on('click', e => {
    const rname = $(e.target).attr('rname');
    const r_date = moment($(e.target).attr('r_date')).format('YYYY-MM-DD');
    const r_time = $(e.target).attr('r_time');
    const raddress = $(e.target).attr('raddress');
    const duname = $(e.target).attr('duname');
    $.ajax({
      type: 'POST',
      data: { rname, r_date, r_time, raddress, duname },
      url: '/reservations/',
      success: () => window.location.reload(),
      error: err => console.log(err)
    })
  })
})

$(document).ready(() => {
  $('#delete-menu').on('click', e => {
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

$(document).ready(() => {
  $('.delete-item').on('click', e => {
    console.log("click");
    const fname = $(e.target).attr('fname');
    const title = $(e.target).attr('title');
    const raddress = $(e.target).attr('raddress');
    const rname = $(e.target).attr('rname');
    $.ajax({
      type: 'DELETE',
      url: '/menus/' + rname + '/' + raddress + '/' + title + '/' + fname,
      success: () => {
        window.location.reload();
      },
      error: err => {
        console.log(err);
      }
    });
  });
});

$(document).ready(() => {
    $('.delete-timeslot').on('click', e => {
        const rname = $(e.target).attr('rname');
        const raddress = $(e.target).attr('raddress');
        const date = moment($(e.target).attr('date')).format('YYYY-MM-DD');
        const time = $(e.target).attr('time');
        $.ajax({
            type: 'DELETE',
            url: '/restaurantowners/' + rname + '/' + raddress + '/' + date + '/' + time,
            success: () => {
                window.location.reload();
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
      '<li><input type="text" name="item" placeholder="item" /><input type="text" name="price" placeholder="price" /></li>'
    );
  });
});
