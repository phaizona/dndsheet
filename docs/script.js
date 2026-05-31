document.addEventListener("DOMContentLoaded", () => {
    
    // 1. AUTO-RESIZE TEXTAREAS
    const tx = document.querySelectorAll(".auto-resize");
    tx.forEach(textarea => {
        textarea.setAttribute("style", "height:" + (textarea.scrollHeight) + "px;overflow-y:hidden;");
        textarea.addEventListener("input", function () {
            this.style.height = "auto";
            this.style.height = (this.scrollHeight) + "px";
        }, false);
    });

    // 2. PORTRAIT UPLOAD / DRAG & DROP
    const portraitBox = document.getElementById('portrait-dropzone');
    const portraitUpload = document.getElementById('portrait-upload');

    portraitUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                portraitBox.style.backgroundImage = `url(${event.target.result})`;
                portraitBox.classList.add('has-image');
            }
            reader.readAsDataURL(file);
        }
    });

    // 3. AUTO-CALCULATE MODIFIERS
    const statInputs = document.querySelectorAll(".stat-score");
    const calculateMod = (val) => {
        let score = parseInt(val);
        if (isNaN(score)) return "";
        let mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    statInputs.forEach(input => {
        input.addEventListener("input", (e) => {
            let stat = e.target.getAttribute("data-stat");
            let modBox = document.getElementById(`mod-${stat}`);
            modBox.value = calculateMod(e.target.value);
        });
    });

    // 4. EXPORT TO PNG
    document.getElementById('btn-png').addEventListener('click', () => {
        document.querySelectorAll('.no-print').forEach(el => el.style.display = 'none');
        
        html2canvas(document.getElementById('character-sheet'), { 
            scale: 2, 
            backgroundColor: null 
        }).then(canvas => {
            let link = document.createElement('a');
            link.download = 'Fantasy_Character_Sheet.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            document.querySelectorAll('.no-print').forEach(el => el.style.display = '');
        });
    });

    // 5. EXPORT TO PDF
    document.getElementById('btn-pdf').addEventListener('click', () => {
        document.querySelectorAll('.no-print').forEach(el => el.style.display = 'none');

        html2canvas(document.getElementById('character-sheet'), { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save("Fantasy_Character_Sheet.pdf");

            document.querySelectorAll('.no-print').forEach(el => el.style.display = '');
        });
    });
});