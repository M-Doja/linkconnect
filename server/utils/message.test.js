var expect = require('expect');

var {generateMessage, generateLocationMessage} = require('./message');

describe('generateMessage', () => {
  it('should generate correct message object', () => {
    var from = 'Jim';
    var text = 'Some message here';
    var message = generateMessage(from, text);

    expect(message.createdAt).toBeA('number');
    expect(message).toInclude({from, text});
  });
});



describe('generateLocationMessage', () => {
  it('should generate correct message object', () => {
    var from = 'Don';
    var longitude = 15;
    var latitude = 21;
    var url = 'https://www.google.com/maps?q=21,15';
    var message = generateLocationMessage(from, latitude, longitude);

    expect(message.createdAt).toBeA('number');
    expect(message).toInclude({from, url});
  });
});
