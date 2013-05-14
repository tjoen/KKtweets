
/*
 * GET main page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'T Witte Rook', criteria:'T Witte Rook' });
};