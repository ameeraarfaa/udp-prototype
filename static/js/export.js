//Handles exporting of the visible map area as an image using html2canvas

export function exportVisibleMap() {
  html2canvas(document.getElementById("map"), {
    useCORS: true
  }).then(canvas => {
    const link = document.createElement("a");
    link.download = "map_view.jpg";
    link.href = canvas.toDataURL("image/jpeg");
    link.click();
  });
}
