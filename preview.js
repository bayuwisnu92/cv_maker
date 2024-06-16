document.addEventListener('DOMContentLoaded', function() {
    // Mengambil data dari localStorage

              var profilePicSrc = localStorage.getItem('profilePicSrc');
              var name = localStorage.getItem('name');
              var address = localStorage.getItem('address');
              var email = localStorage.getItem('email');
              var phone = localStorage.getItem('phone');
              var facebook = localStorage.getItem('facebook');
              var twitter = localStorage.getItem('twitter');
              var instagram = localStorage.getItem('instagram');
              var github = localStorage.getItem('github');
  
              // Menampilkan data di elemen HTML
              document.getElementById('profilePicPreview').src = profilePicSrc;
              document.getElementById('namePreview').innerText = name;
              document.getElementById('addressPreview').innerText = address;
              document.getElementById('emailPreview').innerText = email;
              document.getElementById('phonePreview').innerText = phone;
              document.getElementById('facebookPreview').innerText = facebook;
              document.getElementById('twitterPreview').innerText = twitter;
              document.getElementById('instagramPreview').innerText = instagram;
              document.getElementById('githubPreview').innerText = github;
  
              // Memuat data list dari localStorage ke elemen list HTML
              loadListFromLocalStorage('personalSkillPreviewList', 'personalSkillData');
              loadListFromLocalStorage('educationPreviewList', 'educationData');
              loadListFromLocalStorage('experiencePreviewList', 'experienceData');
              loadListFromLocalStorage('organizationPreviewList', 'organizationData');
              loadListFromLocalStorage('hobiPreviewList', 'hobiData');
              loadFormsFromLocalStorage()
              alert("selamat data anda berhasil diinput");
          });
  
  
      function loadListFromLocalStorage(previewListId, localStorageKey) {
        var previewList = document.getElementById(previewListId);
        var data = JSON.parse(localStorage.getItem(localStorageKey));
        previewList.innerHTML = '';
        data.forEach(function(item) {
          var li = document.createElement("li");
          li.innerText = item;
          previewList.appendChild(li);
        });
      }
  
      function scrollToTopAndExecute(callback) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(callback, 500);  // Adjust the timeout as needed
      }
  
      function saveAsPDF() {
        document.getElementById('previewButtons').style.display = 'none';
        html2canvas(document.getElementById('previewPage')).then(canvas => {
          var imgData = canvas.toDataURL('image/png');
          var doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          var imgProps = doc.getImageProperties(imgData);
          var pdfWidth = doc.internal.pageSize.getWidth();
          var pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          doc.save('cv.pdf');
          document.getElementById('previewButtons').style.display = 'block';
        });
      }
  
      function printCV() {
        document.getElementById('previewButtons').style.display = 'none';
        window.print();
        document.getElementById('previewButtons').style.display = 'block';
      }
  
      function saveAsImage() {
        document.getElementById('previewButtons').style.display = 'none';
        html2canvas(document.getElementById('previewPage')).then(canvas => {
          var link = document.createElement('a');
          link.href = canvas.toDataURL();
          link.download = 'cv.png';
          link.click();
          document.getElementById('previewButtons').style.display = 'block';
        });
      }
      function loadFormsFromLocalStorage() {
        var data = localStorage.getItem('newFormsData');
        if (data) {
            var forms = JSON.parse(data);
            var previewContainer = document.getElementById('preview-container');
            
            forms.forEach(function(form) {
                // Buat elemen untuk judul form
                var formTitle = document.createElement('h5');
                formTitle.className = "judul";
                formTitle.innerText = form.title;
                previewContainer.appendChild(formTitle);
                
                // Buat elemen untuk daftar item
                var ul = document.createElement('ul');
                form.items.forEach(function(item) {
                    var li = document.createElement('li');
                    li.innerText = item;
                    ul.appendChild(li);
                });
                previewContainer.appendChild(ul);
            });
        } else {
            console.log('No data found in localStorage');
        }
    }
    
    // Panggil fungsi untuk memuat dan menampilkan data
    // loadFormsFromLocalStorage();
    // rubah warna 

    document.addEventListener('DOMContentLoaded', function() {
    // Fungsi untuk mengubah warna latar belakang
    function changeBackgroundColor(buttonId, color) {
        var changeColorButton = document.getElementById(buttonId);
        
        changeColorButton.addEventListener('click', function() {
            // Ambil semua elemen dengan kelas 'isi'
            var isiElements = document.querySelectorAll('.isi');
            // Ambil semua elemen dengan kelas 'judul'
            var judulElements = document.querySelectorAll('.judul');
            var rightElements = document.querySelectorAll('.right-column');
            
            // Ubah background color semua elemen dengan kelas 'isi' dan 'judul' menjadi warna yang diberikan
            isiElements.forEach(function(element) {
                element.style.backgroundColor = color;
            });
            
            judulElements.forEach(function(element) {
                element.style.backgroundColor = color;
            });

            // Ubah background color semua elemen dengan kelas 'right-column' menjadi putih
            rightElements.forEach(function(element) {
                element.style.backgroundColor = 'white';
            });
        });
    }
    
    // Panggil fungsi untuk setiap tombol dengan warna yang berbeda
    changeBackgroundColor('changeColorButton1', 'navy');
    changeBackgroundColor('changeColorButton2', 'black');
    changeBackgroundColor('changeColorButton3', 'pink');
    changeBackgroundColor('changeColorButton4', 'red');
    changeBackgroundColor('changeColorButton5', 'green');
});
