var socket = io();

function scrollToBottom(){
  var messages = $('#messages');
  var newMessage = messages.children('li:last-child');
  var clientHeight = messages.prop('clientHeight');
  var scrollTop = messages.prop('scrollTop');
  var scrollHeight = messages.prop('scrollHeight');
  var x = newMessage.innerHeight();
  var y = newMessage.prev().innerHeight();
  if (clientHeight + scrollTop + x + y>= scrollHeight) {
    messages.scrollTop(scrollHeight);
  }
}

socket.on('connect', function ()  {
  console.log('Connected to server');
  var params = $.deparam(window.location.search);
  socket.emit('join', params, function(err) {
    if (err) {
      alert(err);
      window.location.href = '/';
    }else {
      console.log('No error');
    }
  });
});

socket.on('disconnect', function ()  {
  console.log('Disconnected from server');
});

socket.on('updateUserList', function(users) {
    var ol = $('<ol></ol>');

    users.forEach(function(user){
      ol.append($('<li></li>').text(user));
    });

    $('#users').html(ol);
});

socket.on('newMessage', function(message) {
  var formattedTime = moment(message.createdAt).format('h:mm a');
  var template = $('#message-template').html();
  var html = Mustache.render(template, {
   text: message.text,
   from: message.from,
   createdAt: formattedTime
  });
  $('#messages').append(html);
  scrollToBottom();
});

socket.on('newLocationMessage', function(message){
  var formattedTime = moment(message.createdAt).format('h:mm a');
  var template = $('#location-message-template').html();
  var html = Mustache.render(template, {
  from: message.from,
   url: message.url,
   createdAt: formattedTime
  });
   $('#messages').append(html);
   scrollToBottom();
});


$("#message-form").on('submit', function(e) {
  e.preventDefault();

  var messageTextBox = $('[name=message]');
  socket.emit('createMessage', {
    text: messageTextBox.val()
  }, function() {
    messageTextBox.val('');
  });
});

var locationBtn = $('#send-location');
locationBtn.on('click', function() {
  if (!navigator.geolocation) {
  return alert('Geolocation not supported by your browser')
}

locationBtn.attr('disabled', 'disabled').text('Sending location...');

  navigator.geolocation.getCurrentPosition(function(position) {
    locationBtn.removeAttr('disabled').text('Send location');
    socket.emit('createLocationMessage', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
  }, function() {
    locationBtn.removeAttr('disabled').text('Send location');
    alert('Unable to fetch location')
  });
});
