
// JavaScript untuk memanipulasi data
    // Fungsi untuk menampilkan pratinjau gambar profil yang diupload
    function previewImage(event) {
      var reader = new FileReader();
      reader.onload = function() {
        var output = document.getElementById('profilePic');
        output.src = reader.result;
      };
      reader.readAsDataURL(event.target.files[0]);
    }

    // Fungsi untuk menambahkan tombol hapus pada item yang sudah ada saat halaman dimuat
    function addRemoveButtonToExistingItems() {
      addRemoveButtonsToList('personalSkillList');
      addRemoveButtonsToList('educationList');
      addRemoveButtonsToList('experienceList');
      addRemoveButtonsToList('organizationList');
      addRemoveButtonsToList('hobiList');
    }

    // Fungsi untuk menambahkan tombol hapus pada setiap item dalam daftar tertentu yang sudah ada
    function addRemoveButtonsToList(listId) {
         var ul = document.getElementById(listId); //Di dalam fungsi, elemen daftar diambil menggunakan document.getElementById(listId) dan disimpan dalam variabel ul.
      var items = ul.getElementsByTagName("li");// mengambil li pada setiap ul
      for (var i = 0; i < items.length; i++) { //pengulangan untuk menambahkan tombol remove pada li
        addRemoveButton(items[i]); // memanggil callback fungsi addRemoveButon untuk mengisi tombol remome pada item
      }
    }

    // Fungsi untuk menambahkan tombol hapus pada elemen yang belum ada<li>
    function addRemoveButton(li) {
      var removeButton = document.createElement("button");
      removeButton.className = "btn btn-danger btn-sm ml-2";
      removeButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
      removeButton.onclick = function() {
        li.parentNode.removeChild(li);
      };
      li.appendChild(removeButton);
    }

    // Fungsi untuk menambah personal skill baru ke daftar
    function addPersonalSkill() {
      var ul = document.getElementById("personalSkillList");
      var li = document.createElement("li");
      li.className = "d-flex align-items-center mb-2";
      li.innerHTML = '<input type="text" value="nama skill - tingkat penguasaan" class="form-control mr-2">';
      addRemoveButton(li);
      ul.appendChild(li);
    }

    // Fungsi untuk menambah pendidikan baru ke daftar
    function addEducation() {
      var ul = document.getElementById("educationList");
      var li = document.createElement("li");
      li.className = "d-flex align-items-center mb-2";
      li.innerHTML = '<input type="text" value="Universitas: Gelar dan (dari tahun-sampai tahun) status-lulus/tidak" class="form-control mr-2">';
      addRemoveButton(li);
      ul.appendChild(li);
    }

    // Fungsi untuk menambah pengalaman kerja baru ke daftar
    function addExperience() {
      var ul = document.getElementById("experienceList");
      var li = document.createElement("li");
      li.className = "d-flex align-items-center mb-2";
      li.innerHTML = '<input type="text" value="Nama Perusahaan: Jabatan dan (dari tahun-sampai tahun)" class="form-control mr-2">';
      addRemoveButton(li);
      ul.appendChild(li);
    }

    // Fungsi untuk menambah pengalaman organisasi baru ke daftar
    function addSkill() {
      var ul = document.getElementById("organizationList");
      var li = document.createElement("li");
      li.className = "d-flex align-items-center mb-2";
      li.innerHTML = '<input type="text" value="nama organisasi - jabatan -(dari tahun-sampai tahun)" class="form-control mr-2">';
      addRemoveButton(li);
      ul.appendChild(li);
    }

    // Fungsi untuk menambah hobi baru ke daftar
    function addHobi() {
      var ul = document.getElementById("hobiList");
      var li = document.createElement("li");
      li.className = "d-flex align-items-center mb-2";
      li.innerHTML = '<input type="text" value="misalkan karaoke" class="form-control mr-2">';
      addRemoveButton(li);
      ul.appendChild(li);
    }

    // Fungsi untuk menyimpan data CV ke local storage dan menuju halaman preview
    function submitCV() {
      var profilePicSrc = document.getElementById('profilePic').src;
      var name = document.getElementById('nameInput').value.trim();
      var address = document.getElementById('addressInput').value.trim();
      var email = document.getElementById('emailInput').value.trim();
      var phone = document.getElementById('phoneInput').value.trim();

      if (!profilePicSrc || !name || !address || !email || !phone) {
        alert("Harap isi semua bidang yang diperlukan.");
        return;
      }

      // Menyimpan data ke local storage
      localStorage.setItem('profilePicSrc', profilePicSrc);
      localStorage.setItem('name', name);
      localStorage.setItem('address', address);
      localStorage.setItem('email', email);
      localStorage.setItem('phone', phone);
      localStorage.setItem('facebook', document.getElementById('facebookInput').value.trim());
      localStorage.setItem('twitter', document.getElementById('twitterInput').value.trim());
      localStorage.setItem('instagram', document.getElementById('instagramInput').value.trim());
      localStorage.setItem('github', document.getElementById('githubInput').value.trim());

      // Menyimpan data daftar ke local storage
      saveListToLocalStorage('personalSkillList', 'personalSkillData'); //parameter pertamaid pertama adalah id yg ada di halaman ini,yg kedua adalah id tempat menyimpan data 
      saveListToLocalStorage('educationList', 'educationData');
      saveListToLocalStorage('experienceList', 'experienceData');
      saveListToLocalStorage('organizationList', 'organizationData');
      saveListToLocalStorage('hobiList', 'hobiData');

      // Menuju halaman preview
      window.location.href = 'preview.html';
    }

    // Fungsi untuk menyimpan data dari daftar ke local storage
    function saveListToLocalStorage(inputListId, localStorageKey) {
      var inputList = document.getElementById(inputListId);
      var data = [];
      for (var i = 0; i < inputList.children.length; i++) {
        data.push(inputList.children[i].children[0].value);
      }
      localStorage.setItem(localStorageKey, JSON.stringify(data));
    }

    // Menambahkan tombol hapus ke item yang sudah ada saat halaman dimuat
    window.onload = function() {
      addRemoveButtonToExistingItems();
    };