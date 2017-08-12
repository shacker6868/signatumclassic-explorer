$(document).ready(function() {
    var table = $('#recent').DataTable({responsive: true,"bFilter": false});
    var data = table
    .order( [ 0, 'desc' ] )
    .draw();
} );

$('.search').click(function() {
    var x = $('.search-box').val();
    if (x[0].match(/[a-z]/i)) {
        window.location = './block?address='+x;
    } else if (x.length <= 7) {
        window.location = './block?block='+x;
    } else if (x.length > 50) {
        window.location = './block?blockHash='+x;
    }
});
/*
$(".time").each(function () {
    var time = this.text();
    var d = new Date(time*1000).toLocaleString();
    console.log(d)
    this.replace
})
*/