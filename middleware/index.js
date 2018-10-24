module.exports = {
  isLoggedIn: function(req, res, next){
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('login');
  },
  capitalizeName: function(nm){
    nm = nm.split(' ');
    if (nm.length > 1) {
      var first = nm[0].charAt(0).toUpperCase() + nm[0].slice(1).toLowerCase();
      var last = nm[1].charAt(0).toUpperCase() + nm[1].slice(1).toLowerCase();
      return nm = first +' '+ last;
    }else {
      return nm =  nm[0].charAt(0).toUpperCase() + nm[0].slice(1).toLowerCase();
    }
  },
  capSentence: function(str){
    var cell = []
    var words = '';
    str = str.split(' ');
    for (let i = 0; i < str.length; i++) {
      cell.push(str[i].charAt(0).toUpperCase() + str[i].slice(1).toLowerCase())
    }
    for (var i = 0; i < cell.length; i++) {
      words += cell[i] + ' ';
    }
    return words;
  }


}
