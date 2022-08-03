let open = false;
$(()=>{
	$("[data-href]").each((index, element)=>{
		let url = $(element).attr("data-href");
		$(element).on("click", (event)=>{
			event.preventDefault();
			Neutralino.os.open(url);
		});
	});
	$("#toggle").on("click", ()=>{
		if (open) {
			open = false;
			$("details").attr("open", false);
			$("#toggle").text(window.getLocalString("toggleLicenseOpen"));
		} else {
			open = true;
			$("details").attr("open", true);
			$("#toggle").text(window.getLocalString("toggleLicenseClose"));
		}
	});
});
