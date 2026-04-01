
        // ============== GLOBAL STATE ==============
        let API_BASE_URL = 'http://localhost:8085/api/banners';
        let isBackendConnected = false;
        let banners = [];
        let currentEditId = null;
        let deleteId = null;

        let bannerState = {
            pageName: '',
            status: 'draft',
            bannerFileTwo: null,
            bannerFileThree: null,
            bannerFileFour: null,
            bannerFileTwoPreview: null,
            bannerFileThreePreview: null,
            bannerFileFourPreview: null,
            slides: []
        };

        // ============== INITIALIZATION ==============
        document.addEventListener('DOMContentLoaded', function () {
            loadComponentsAndInit();
        });

        async function loadComponentsAndInit() {
            await loadComponent('sidebar-container', '../sidebar.html');
            await loadComponent('header-container', '../header.html');
            await testBackendConnection();
            setupEventListeners();
        }

        function setupEventListeners() {
            document.getElementById('searchInput')?.addEventListener('keyup', filterBanners);
            document.getElementById('statusFilter')?.addEventListener('change', filterBanners);
            document.getElementById('sortSelect')?.addEventListener('change', filterBanners);
        }

        async function testBackendConnection() {
            const statusDiv = document.getElementById('connectionStatus');
            if (!statusDiv) return;
            try {
                const response = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(5000) });
                if (response.ok) {
                    isBackendConnected = true;
                    statusDiv.innerHTML = '<i class="fa-solid fa-circle-check"></i> Backend Connected';
                    statusDiv.className = 'connection-status online';
                    await loadBanners();
                } else throw new Error(`HTTP ${response.status}`);
            } catch (error) {
                isBackendConnected = false;
                statusDiv.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Backend Not Available';
                statusDiv.className = 'connection-status offline';
                showAlert('Cannot connect to backend. Please make sure the backend is running.', 'error');
            }
        }

        async function loadBanners() {
            if (!isBackendConnected) return;
            const tbody = document.getElementById('bannersTableBody');
            if (!tbody) return;
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 md:py-8"><div class="spinner mb-2"></div><p>Loading banners...</p></td></tr>`;
            try {
                const response = await fetch(`${API_BASE_URL}/get-all-banners`);
                const result = await response.json();
                if (result.success && result.data) {
                    banners = result.data;
                    updateStatistics();
                    renderBannersTable();
                } else throw new Error(result.message || 'Failed to load banners');
            } catch (error) {
                showAlert('Failed to load banners: ' + error.message, 'error');
                tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 md:py-8 text-red-500">Error: ${error.message}</td></tr>`;
            }
        }

        function updateStatistics() {
            const total = banners.length;
            const published = banners.filter(b => b.status === 'published').length;
            const draft = banners.filter(b => b.status === 'draft').length;
            const totalSlides = banners.reduce((sum, b) => sum + (b.slidesCount || 0), 0);
            document.getElementById('totalBanners').textContent = total;
            document.getElementById('publishedBanners').textContent = published;
            document.getElementById('draftBanners').textContent = draft;
            document.getElementById('totalSlides').textContent = totalSlides;
        }

        function formatDate(dateString) {
            if (!dateString) return 'N/A';
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return 'N/A';
                return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            } catch (e) { return 'N/A'; }
        }

        function filterBanners() {
            const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
            const statusFilter = document.getElementById('statusFilter')?.value || 'all';
            const sortBy = document.getElementById('sortSelect')?.value || 'newest';
            let filtered = [...banners];
            if (searchTerm) filtered = filtered.filter(b => b.pageName.toLowerCase().includes(searchTerm));
            if (statusFilter !== 'all') filtered = filtered.filter(b => b.status === statusFilter);
            if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            else if (sortBy === 'oldest') filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            else if (sortBy === 'name') filtered.sort((a, b) => a.pageName.localeCompare(b.pageName));
            renderBannersTable(filtered);
        }

        function renderBannersTable(data = null) {
            const tbody = document.getElementById('bannersTableBody');
            if (!tbody) return;
            const bannersToRender = data || banners;
            if (!bannersToRender || bannersToRender.length === 0) {
                tbody.innerHTML = `§<td colspan="6" class="text-center py-6 md:py-8 text-gray-500">No banners found</td>`;
                return;
            }
            tbody.innerHTML = bannersToRender.map(banner => `
                <tr class="border-b border-gray-100 hover:bg-[#F8F8EA] transition-colors">
                    <td class="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">${banner.id}</td>
                    <td class="py-2 md:py-3 px-2 md:px-4"><span class="text-xs md:text-sm font-medium" style="color: #133F53;">${escapeHtml(banner.pageName)}</span></td>
                    <td class="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">${banner.slidesCount || 0}</td>
                    <td class="py-2 md:py-3 px-2 md:px-4"><span class="status-badge ${banner.status}"><i class="${banner.status === 'published' ? 'fa-regular fa-circle-check' : 'fa-regular fa-file'}"></i>${banner.status === 'published' ? 'Published' : 'Draft'}</span></td>
                    <td class="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm">${formatDate(banner.createdAt)}</td>
                    <td class="py-2 md:py-3 px-2 md:px-4"><div class="flex gap-1 md:gap-2"><button onclick="viewBanner(${banner.id})" class="text-[#957A54] hover:text-[#133F53] p-1 transition-colors"><i class="fa-regular fa-eye text-sm md:text-base"></i></button><button onclick="editBanner(${banner.id})" class="text-[#957A54] hover:text-[#D89F34] p-1 transition-colors"><i class="fa-regular fa-pen-to-square text-sm md:text-base"></i></button><button onclick="openDeleteModal(${banner.id})" class="text-[#957A54] hover:text-red-600 p-1 transition-colors"><i class="fa-regular fa-trash-can text-sm md:text-base"></i></button></div></td>
                </tr>
            `).join('');
        }

        // ============== FILE HANDLERS ==============
        function handleFileChange(fieldId, event) {
            const file = event.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) { showAlert('Please select an image file', 'error'); return; }
            bannerState[fieldId] = file;
            const reader = new FileReader();
            reader.onload = function (e) {
                bannerState[fieldId + 'Preview'] = e.target.result;
                const previewImg = document.getElementById(fieldId + 'Preview');
                const removeBtn = document.getElementById(fieldId + 'RemoveBtn');
                const infoDiv = document.getElementById(fieldId + 'Info');
                if (previewImg) { previewImg.src = e.target.result; previewImg.classList.remove('hidden'); }
                if (removeBtn) removeBtn.classList.remove('hidden');
                if (infoDiv) {
                    infoDiv.innerHTML = `<div class="file-info"><i class="fa-solid fa-file-image text-blue-500"></i><span class="file-info-name">${escapeHtml(file.name)}</span><span class="file-info-size">${(file.size / 1024).toFixed(2)} KB</span><i class="fa-solid fa-check-circle text-green-500"></i></div>`;
                    infoDiv.classList.remove('hidden');
                }
            };
            reader.readAsDataURL(file);
        }

        function removeFile(fieldId) {
            bannerState[fieldId] = null;
            bannerState[fieldId + 'Preview'] = null;
            const fileInput = document.getElementById(fieldId);
            if (fileInput) fileInput.value = '';
            const previewImg = document.getElementById(fieldId + 'Preview');
            if (previewImg) { previewImg.src = ''; previewImg.classList.add('hidden'); }
            const removeBtn = document.getElementById(fieldId + 'RemoveBtn');
            if (removeBtn) removeBtn.classList.add('hidden');
            const infoDiv = document.getElementById(fieldId + 'Info');
            if (infoDiv) { infoDiv.innerHTML = ''; infoDiv.classList.add('hidden'); }
        }

        function handleDragOver(event) { event.preventDefault(); event.currentTarget.classList.add('dragover'); }
        function handleDragLeave(event) { event.currentTarget.classList.remove('dragover'); }
        function handleDrop(event, fieldId) {
            event.preventDefault(); event.currentTarget.classList.remove('dragover');
            const file = event.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                const fileInput = document.getElementById(fieldId);
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        // ============== SLIDE MANAGEMENT ==============
        function addSlide() {
            bannerState.slides.push({ 
                dotPosition: bannerState.slides.length + 1, 
                leftMain: { title: '', image: null, imagePreview: null, redirectUrl: '#' }, 
                rightTop: { image: null, imagePreview: null, redirectUrl: '#' }, 
                rightCard: { title: '', description: '' } 
            });
            renderSlides();
            document.getElementById('noSlidesMessage').style.display = 'none';
        }

        function removeSlide(index) {
            bannerState.slides.splice(index, 1);
            bannerState.slides.forEach((slide, idx) => slide.dotPosition = idx + 1);
            renderSlides();
            if (bannerState.slides.length === 0) document.getElementById('noSlidesMessage').style.display = 'block';
        }

        function handleSlideImageChange(slideIndex, type, event) {
            const file = event.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) { showAlert('Please select an image file', 'error'); return; }
            const reader = new FileReader();
            reader.onload = function (e) {
                bannerState.slides[slideIndex][type].image = file;
                bannerState.slides[slideIndex][type].imagePreview = e.target.result;
                const previewImg = document.getElementById(`${type}Preview_${slideIndex}`);
                if (previewImg) { previewImg.src = e.target.result; previewImg.classList.remove('hidden'); }
            };
            reader.readAsDataURL(file);
        }

        function renderSlides() {
            const container = document.getElementById('slidesContainer');
            if (!container) return;
            container.innerHTML = '';
            if (bannerState.slides.length === 0) return;
            bannerState.slides.forEach((slide, index) => {
                const leftMainPreview = slide.leftMain.imagePreview || '';
                const rightTopPreview = slide.rightTop.imagePreview || '';
                container.innerHTML += `
                    <div class="slide-card">
                        <div class="slide-header">
                            <h5 class="slide-title"><i class="fa-solid fa-layer-group"></i> Slide ${slide.dotPosition}</h5>
                            <button type="button" onclick="removeSlide(${index})" class="text-red-500 hover:text-red-700 text-sm transition-colors"><i class="fa-regular fa-trash-can"></i> Remove</button>
                        </div>
                        <div class="slide-section">
                            <div class="slide-section-title"><i class="fa-solid fa-image" style="color: #3b82f6;"></i> Left Main Image</div>
                            <div class="space-y-3">
                                <input type="text" placeholder="Title (optional)" value="${escapeHtml(slide.leftMain.title || '')}" onchange="bannerState.slides[${index}].leftMain.title = this.value" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                                <div>
                                    <div class="upload-area p-2 text-sm" onclick="document.getElementById('leftMainImage_${index}').click()"><i class="fa-solid fa-cloud-upload-alt"></i> Upload New Image</div>
                                    <input type="file" id="leftMainImage_${index}" accept="image/*" class="hidden" onchange="handleSlideImageChange(${index}, 'leftMain', event)">
                                    ${leftMainPreview ? `<img id="leftMainPreview_${index}" class="preview-image" src="${leftMainPreview}">` : `<img id="leftMainPreview_${index}" class="preview-image hidden">`}
                                </div>
                                <input type="text" placeholder="Redirect URL (optional)" value="${escapeHtml(slide.leftMain.redirectUrl || '#')}" onchange="bannerState.slides[${index}].leftMain.redirectUrl = this.value" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                            </div>
                        </div>
                        <div class="slide-section">
                            <div class="slide-section-title"><i class="fa-solid fa-image" style="color: #10b981;"></i> Right Top Image</div>
                            <div>
                                <div class="upload-area p-2 text-sm" onclick="document.getElementById('rightTopImage_${index}').click()"><i class="fa-solid fa-cloud-upload-alt"></i> Upload New Image</div>
                                <input type="file" id="rightTopImage_${index}" accept="image/*" class="hidden" onchange="handleSlideImageChange(${index}, 'rightTop', event)">
                                ${rightTopPreview ? `<img id="rightTopPreview_${index}" class="preview-image" src="${rightTopPreview}">` : `<img id="rightTopPreview_${index}" class="preview-image hidden">`}
                            </div>
                            <div class="mt-2"><input type="text" placeholder="Redirect URL (optional)" value="${escapeHtml(slide.rightTop.redirectUrl || '#')}" onchange="bannerState.slides[${index}].rightTop.redirectUrl = this.value" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"></div>
                        </div>
                        <div class="slide-section">
                            <div class="slide-section-title"><i class="fa-solid fa-address-card" style="color: #8b5cf6;"></i> Right Card Content</div>
                            <div class="space-y-3">
                                <input type="text" placeholder="Card Title (optional)" value="${escapeHtml(slide.rightCard.title || '')}" onchange="bannerState.slides[${index}].rightCard.title = this.value" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                                <textarea placeholder="Card Description (optional)" rows="2" onchange="bannerState.slides[${index}].rightCard.description = this.value" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">${escapeHtml(slide.rightCard.description || '')}</textarea>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        // ============== SAVE BANNER ==============
        async function saveBanner(event) {
            event.preventDefault();
            showLoading(true);
            const pageName = document.getElementById('pageName').value;
            const status = document.getElementById('status').value;
            if (!pageName.trim()) { showLoading(false); showAlert('Page name is required', 'error'); return; }
            if (bannerState.slides.length === 0) { showLoading(false); showAlert('At least one slide is required', 'error'); return; }
            try {
                const formData = new FormData();
                formData.append('pageName', pageName);
                formData.append('status', status);
                if (bannerState.bannerFileTwo) formData.append('bannerFileTwo', bannerState.bannerFileTwo);
                if (bannerState.bannerFileThree) formData.append('bannerFileThree', bannerState.bannerFileThree);
                if (bannerState.bannerFileFour) formData.append('bannerFileFour', bannerState.bannerFileFour);
                const slidesMetadata = bannerState.slides.map((slide, index) => ({
                    dotPosition: index + 1,
                    leftMainTitle: slide.leftMain.title || '',
                    leftMainRedirectUrl: slide.leftMain.redirectUrl || '#',
                    rightTopRedirectUrl: slide.rightTop.redirectUrl || '#',
                    rightCardTitle: slide.rightCard.title || '',
                    rightCardDescription: slide.rightCard.description || ''
                }));
                formData.append('slidesMetadata', JSON.stringify(slidesMetadata));
                bannerState.slides.forEach(slide => { if (slide.leftMain.image) formData.append('leftMainImages', slide.leftMain.image); });
                bannerState.slides.forEach(slide => { if (slide.rightTop.image) formData.append('rightTopImages', slide.rightTop.image); });
                const isEditMode = currentEditId !== null && currentEditId !== '';
                const url = isEditMode ? `${API_BASE_URL}/update-banner/${currentEditId}` : `${API_BASE_URL}/create-banner`;
                const method = isEditMode ? 'PUT' : 'POST';
                const response = await fetch(url, { method, body: formData });
                const result = await response.json();
                showLoading(false);
                if (response.ok && result.success) {
                    showAlert(isEditMode ? 'Banner updated successfully!' : 'Banner created successfully!', 'success');
                    closeModal();
                    resetForm();
                    await loadBanners();
                } else {
                    showAlert(result.message || 'Failed to save banner', 'error');
                }
            } catch (error) {
                showLoading(false);
                showAlert('Network error: ' + error.message, 'error');
            }
        }

        // ============== MODAL FUNCTIONS ==============
        function openCreateModal() {
            if (!isBackendConnected) { showAlert('Backend not connected. Please check your server.', 'error'); return; }
            currentEditId = null;
            resetForm();
            document.getElementById('modalTitle').textContent = 'Create New Banner';
            document.getElementById('bannerModal').classList.remove('hidden');
            document.getElementById('bannerModal').classList.add('flex');
        }

        async function editBanner(id) {
            if (!isBackendConnected) { showAlert('Backend not connected.', 'error'); return; }
            showLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/get-banner-by-id/${id}`);
                const result = await response.json();
                showLoading(false);
                if (result.success && result.data) {
                    const data = result.data;
                    currentEditId = id;
                    resetForm();
                    document.getElementById('pageName').value = data.pageName;
                    document.getElementById('status').value = data.status || 'draft';
                    document.getElementById('modalTitle').textContent = `Edit Banner - ${data.pageName}`;
                    function buildImageUrl(url) {
                        if (!url) return null;
                        if (url.startsWith('http')) return url;
                        let cleanUrl = url;
                        if (cleanUrl.startsWith('/api/')) cleanUrl = cleanUrl.substring(5);
                        if (cleanUrl.startsWith('banners/')) cleanUrl = cleanUrl.substring(8);
                        if (!cleanUrl.startsWith('/')) cleanUrl = '/' + cleanUrl;
                        return `${API_BASE_URL}${cleanUrl}`;
                    }
                    if (data.bannerFileTwoUrl) {
                        const url = buildImageUrl(data.bannerFileTwoUrl);
                        const previewImg = document.getElementById('bannerFileTwoPreview');
                        const removeBtn = document.getElementById('bannerFileTwoRemoveBtn');
                        const infoDiv = document.getElementById('bannerFileTwoInfo');
                        if (previewImg && url) { previewImg.src = url; previewImg.classList.remove('hidden'); }
                        if (removeBtn) removeBtn.classList.remove('hidden');
                        if (infoDiv) { infoDiv.innerHTML = `<div class="file-info"><i class="fa-solid fa-file-image text-blue-500"></i><span>Existing banner image</span><i class="fa-solid fa-check-circle text-green-500"></i></div>`; infoDiv.classList.remove('hidden'); }
                    }
                    if (data.bannerFileThreeUrl) {
                        const url = buildImageUrl(data.bannerFileThreeUrl);
                        const previewImg = document.getElementById('bannerFileThreePreview');
                        const removeBtn = document.getElementById('bannerFileThreeRemoveBtn');
                        const infoDiv = document.getElementById('bannerFileThreeInfo');
                        if (previewImg && url) { previewImg.src = url; previewImg.classList.remove('hidden'); }
                        if (removeBtn) removeBtn.classList.remove('hidden');
                        if (infoDiv) { infoDiv.innerHTML = `<div class="file-info"><i class="fa-solid fa-file-image text-blue-500"></i><span>Existing banner image</span><i class="fa-solid fa-check-circle text-green-500"></i></div>`; infoDiv.classList.remove('hidden'); }
                    }
                    if (data.bannerFileFourUrl) {
                        const url = buildImageUrl(data.bannerFileFourUrl);
                        const previewImg = document.getElementById('bannerFileFourPreview');
                        const removeBtn = document.getElementById('bannerFileFourRemoveBtn');
                        const infoDiv = document.getElementById('bannerFileFourInfo');
                        if (previewImg && url) { previewImg.src = url; previewImg.classList.remove('hidden'); }
                        if (removeBtn) removeBtn.classList.remove('hidden');
                        if (infoDiv) { infoDiv.innerHTML = `<div class="file-info"><i class="fa-solid fa-file-image text-blue-500"></i><span>Existing banner image</span><i class="fa-solid fa-check-circle text-green-500"></i></div>`; infoDiv.classList.remove('hidden'); }
                    }
                    if (data.slides && data.slides.length) {
                        bannerState.slides = data.slides.map((slide, idx) => ({
                            dotPosition: slide.dotPosition || idx + 1,
                            leftMain: { title: slide.leftMain?.title || '', redirectUrl: slide.leftMain?.redirectUrl || '#', image: null, imagePreview: slide.leftMain?.imageUrl ? buildImageUrl(slide.leftMain.imageUrl) : null },
                            rightTop: { redirectUrl: slide.rightTop?.redirectUrl || '#', image: null, imagePreview: slide.rightTop?.imageUrl ? buildImageUrl(slide.rightTop.imageUrl) : null },
                            rightCard: { title: slide.rightCard?.title || '', description: slide.rightCard?.description || '' }
                        }));
                        renderSlides();
                        if (bannerState.slides.length > 0) document.getElementById('noSlidesMessage').style.display = 'none';
                    }
                    document.getElementById('bannerModal').classList.remove('hidden');
                    document.getElementById('bannerModal').classList.add('flex');
                } else {
                    showAlert(result.message || 'Failed to load banner', 'error');
                }
            } catch (error) {
                showLoading(false);
                showAlert('Error loading banner: ' + error.message, 'error');
            }
        }

        function closeModal() {
            document.getElementById('bannerModal').classList.add('hidden');
            document.getElementById('bannerModal').classList.remove('flex');
            resetForm();
        }

        function resetForm() {
            document.getElementById('pageName').value = '';
            document.getElementById('status').value = 'draft';
            ['bannerFileTwo', 'bannerFileThree', 'bannerFileFour'].forEach(field => removeFile(field));
            bannerState.slides = [];
            renderSlides();
            document.getElementById('noSlidesMessage').style.display = 'block';
        }

        async function viewBanner(id) {
            if (!isBackendConnected) { showAlert('Backend not connected.', 'error'); return; }
            showLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/get-banner-by-id/${id}`);
                const result = await response.json();
                showLoading(false);
                if (result.success && result.data) {
                    const data = result.data;
                    document.getElementById('viewDetails').innerHTML = `
                        <div class="space-y-4"><div class="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div><label class="text-xs text-gray-500">ID</label><p class="text-sm font-medium">${data.id}</p></div>
                            <div><label class="text-xs text-gray-500">Page Name</label><p class="text-sm">${escapeHtml(data.pageName)}</p></div>
                            <div><label class="text-xs text-gray-500">Status</label><p><span class="status-badge ${data.status}">${data.status}</span></p></div>
                            <div><label class="text-xs text-gray-500">Slides Count</label><p class="text-sm">${data.slides?.length || 0}</p></div>
                            <div><label class="text-xs text-gray-500">Created At</label><p class="text-sm">${formatDate(data.createdAt)}</p></div>
                            <div><label class="text-xs text-gray-500">Updated At</label><p class="text-sm">${formatDate(data.updatedAt)}</p></div>
                        </div></div>
                    `;
                    document.getElementById('viewModal').classList.remove('hidden');
                    document.getElementById('viewModal').classList.add('flex');
                } else showAlert(result.message || 'Failed to load banner details', 'error');
            } catch (error) { showLoading(false); showAlert('Error loading banner details: ' + error.message, 'error'); }
        }

        function closeViewModal() {
            document.getElementById('viewModal').classList.add('hidden');
            document.getElementById('viewModal').classList.remove('flex');
        }

        function openDeleteModal(id) { deleteId = id; document.getElementById('deleteModal').classList.remove('hidden'); document.getElementById('deleteModal').classList.add('flex'); }
        function closeDeleteModal() { deleteId = null; document.getElementById('deleteModal').classList.add('hidden'); document.getElementById('deleteModal').classList.remove('flex'); }

        async function confirmDelete() {
            if (!deleteId) return;
            if (!isBackendConnected) { showAlert('Backend not connected.', 'error'); closeDeleteModal(); return; }
            showLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/delete-banner/${deleteId}`, { method: 'DELETE' });
                const result = await response.json();
                showLoading(false);
                if (response.ok && result.success) {
                    showAlert('Banner deleted successfully', 'success');
                    await loadBanners();
                } else showAlert(result.message || 'Failed to delete banner', 'error');
            } catch (error) { showLoading(false); showAlert('Error deleting banner: ' + error.message, 'error'); }
            closeDeleteModal();
        }

        function exportBanners() {
            if (banners.length === 0) { showAlert('No banners to export', 'warning'); return; }
            const headers = ['ID', 'Page Name', 'Slides Count', 'Status', 'Created At'];
            const csvRows = [headers.join(',')];
            banners.forEach(b => { csvRows.push(`${b.id},"${b.pageName}",${b.slidesCount || 0},${b.status},${formatDate(b.createdAt)}`); });
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `banners_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            showAlert('Banners exported successfully', 'success');
        }

        function escapeHtml(str) { if (!str) return ''; return String(str).replace(/[&<>]/g, m => { if (m === '&') return '&amp;'; if (m === '<') return '&lt;'; if (m === '>') return '&gt;'; return m; }); }

        function showAlert(message, type) {
            const container = document.getElementById('alertsContainer');
            if (!container) return;
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type}`;
            alertDiv.innerHTML = `<span>${escapeHtml(message)}</span><button onclick="this.parentElement.remove()" class="ml-4">&times;</button>`;
            container.appendChild(alertDiv);
            setTimeout(() => { if (alertDiv.parentElement) alertDiv.remove(); }, 5000);
        }

        function showLoading(show) {
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) { if (show) overlay.classList.remove('hidden'); else overlay.classList.add('hidden'); }
        }

        async function loadComponent(containerId, url) {
            const container = document.getElementById(containerId);
            if (!container) return;
            try {
                const response = await fetch(url);
                if (response.ok) container.innerHTML = await response.text();
                else throw new Error(`HTTP ${response.status}`);
            } catch (error) {
                if (containerId === 'sidebar-container') {
                    container.innerHTML = `<div class="bg-white h-screen shadow-lg p-3 md:p-4"><h2 class="text-lg md:text-xl font-bold text-[#133F53] mb-4">Admin Panel</h2><ul class="space-y-2"><li><a href="#" class="block p-2 rounded bg-[#D89F34] text-[#133F53] font-medium">Banner Management</a></li></ul></div>`;
                } else if (containerId === 'header-container') {
                    container.innerHTML = `<header class="bg-white shadow-sm p-3 md:p-4"><h1 class="text-base md:text-xl font-semibold text-[#133F53]">Banner Management</h1></header>`;
                }
            }
        }
    