var show_label="Advance Search &darr;";
var hide_label="Hide options &uarr;";
var searchForms=[];

(function( $ ){
	$.fn.hider = function() {
		return this.each(function(){
			var id=$(this).attr('id');
			$(this).addClass("hide_show");
			$('#'+id+"_link").html(show_label);
			$('#'+id+"_link").addClass("hide_show_link");
			$('#'+id+"_target").addClass("hide_show_target");
			$('#'+id+'_link').click(function(){
				if ($('#'+id+"_target").css('display')=="block"){
					$('#'+id+"_target").css('display','none');
					$('#'+id+"_link").html(show_label);
				}else{
					$('#'+id+"_target").css('display','block');
					$('#'+id+"_link").html(hide_label);
				}
			});
		});
	};
})( jQuery );

(function( $ ){
	$.fn.topForm = function() {
		return this.each(function(){
			var id=$(this).attr('id');
			searchForms.push(id);
			$(this).children('header').click(function(){
				for (var i=0;i<searchForms.length;i++){
					$('#'+searchForms[i]).children('form').hide();
				}
				$('#'+id).children('form').show();
			});
		});
	};
})( jQuery );

var server_url = 'http://www.ebi.ac.uk/enfin-srv/das-srv/das/uniprot2probes';
var client = JSDAS.Simple.getClient(server_url);

/**
 * This function will be executed in case of error
 */
var error_response = function(){
        alert('Bad response, Wrong URL?, No XML Response?');
};

/**
 *  This function print the annotations for the protein id P00280
 */
var response = function(res){
	var annotations = res.GFF.SEGMENT[0].FEATURE;// getting all the annotations
	
	var text = 'Proteins related with the protein '+res.GFF.SEGMENT[0].id+':<br/>';
	for (var i = 0; i < annotations.length; i++) {
		text +='<div class="result">';
		var ann = annotations[i];
		text +='<a href="'+ann.LINK[0].href+'" target="_blank">'+ann.label+'</a><br/>';
		text +=' &#149; Chip: '+ann.TYPE.textContent+'<br/>';
		text +=' &#149; Type: XXXXX<br/>';
		text +=' &#149; Organism: '+ann.TYPE.category+'<br/>';
		text +=' &#149; Sequence: XXXXX<br/>';
		text +='</div>';
	}
	$('#results').html(text);
};
//Asking the client to retrieve the annotations for P00280
//client.features({segment: 'P00280'}, response, error_response);
