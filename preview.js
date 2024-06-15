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