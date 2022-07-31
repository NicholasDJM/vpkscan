$(()=>{
	$("[data-href]").each((index, element)=>{
		let url = $(element).attr("data-href");
		$(element).on("click", (event)=>{
			event.preventDefault();
			Neutralino.os.open(url);
		});
	});
});