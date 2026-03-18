let slides = []
let currentPage = 'home'

// Sample data based on payload
const sampleData = [
    {
        "pageName": "home",
        "slides": [
            {
                "dotPosition": 1,
                "leftMain": {
                    "title": "Big Sale Banner",
                    "imageUrl": "/uploads/banners/banner1.jpg",
                    "redirectUrl": "/products/sale"
                },
                "rightTop": {
                    "imageUrl": "/uploads/banners/banner2.jpg",
                    "redirectUrl": "/offers"
                },
                "rightCard": {
                    "title": "Exclusive Deals",
                    "description": "Limited time deals available now"
                }
            },
            {
                "dotPosition": 2,
                "leftMain": {
                    "title": "Summer Collection",
                    "imageUrl": "/uploads/banners/banner3.jpg",
                    "redirectUrl": "/products/summer"
                },
                "rightTop": {
                    "imageUrl": "/uploads/banners/banner4.jpg",
                    "redirectUrl": "/new-arrivals"
                },
                "rightCard": {
                    "title": "New Arrivals",
                    "description": "Check out our latest products"
                }
            }
        ],
        "bannerFileTwo": "/uploads/banners/banner1.jpg",
        "bannerFileThree": "/uploads/banners/banner2.jpg",
        "bannerFileFour": "/uploads/banners/banner3.jpg"
    }
]

// Initialize the application
function initializeApp() {
    loadSampleData()
    setupEventListeners()
    updateSlideCount()
}

function setupEventListeners() {
    document.getElementById('pageSelector').addEventListener('change', function(e) {
        currentPage = e.target.value
        document.getElementById('pageName').value = currentPage
        loadPageData(currentPage)
    })
}

function loadSampleData() {
    slides = JSON.parse(JSON.stringify(sampleData[0].slides)) // Deep clone
    document.getElementById('bannerTwoPath').value = sampleData[0].bannerFileTwo
    document.getElementById('bannerThreePath').value = sampleData[0].bannerFileThree
    document.getElementById('bannerFourPath').value = sampleData[0].bannerFileFour
    renderSlides()
}

function loadPageData(pageName) {
    // In real app, fetch from API based on page
    showToast(`Loading data for ${pageName} page`, 'info')
}

function addSlide() {
    const newSlide = {
        dotPosition: slides.length + 1,
        leftMain: {
            title: "",
            imageUrl: "",
            redirectUrl: ""
        },
        rightTop: {
            imageUrl: "",
            redirectUrl: ""
        },
        rightCard: {
            title: "",
            description: ""
        }
    }
    slides.push(newSlide)
    renderSlides()
    updateSlideCount()
    showToast('New slide added successfully', 'success')
}

function duplicateLastSlide() {
    if (slides.length > 0) {
        const lastSlide = JSON.parse(JSON.stringify(slides[slides.length - 1]))
        lastSlide.dotPosition = slides.length + 1
        slides.push(lastSlide)
        renderSlides()
        updateSlideCount()
        showToast('Slide duplicated successfully', 'success')
    }
}

function removeSlide(index) {
    if (slides.length > 1) {
        if (confirm('Are you sure you want to remove this slide?')) {
            slides.splice(index, 1)
            // Reorder dot positions
            slides.forEach((slide, idx) => {
                slide.dotPosition = idx + 1
            })
            renderSlides()
            updateSlideCount()
            showToast('Slide removed successfully', 'success')
        }
    } else {
        showToast('Cannot remove the last slide', 'error')
    }
}

function renderSlides() {
    const container = document.getElementById('slidesContainer')
    container.innerHTML = ''

    slides.forEach((slide, index) => {
        const slideHtml = createSlideHtml(slide, index)
        container.innerHTML += slideHtml
    })

    // Re-attach event listeners for file inputs
    slides.forEach((slide, index) => {
        setupSlideFileInputs(index)
    })
}

function createSlideHtml(slide, index) {
    return `
        <div class="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition relative group" data-slide-index="${index}">
            <!-- Slide Header -->
            <div class="flex justify-between items-center mb-4 pb-2 border-b">
                <div class="flex items-center space-x-3">
                    <span class="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">${slide.dotPosition}</span>
                    <h3 class="font-semibold text-lg">Slide ${slide.dotPosition}</h3>
                </div>
                <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                    <button onclick="moveSlideUp(${index})" class="text-gray-500 hover:text-blue-600 p-1" ${index === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button onclick="moveSlideDown(${index})" class="text-gray-500 hover:text-blue-600 p-1" ${index === slides.length - 1 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-down"></i>
                    </button>
                    <button onclick="removeSlide(${index})" class="text-gray-500 hover:text-red-600 p-1">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <!-- Slide Content -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Left Main Banner -->
                <div class="space-y-3">
                    <h4 class="font-medium text-blue-600 flex items-center">
                        <i class="fas fa-arrow-right mr-2"></i>Left Main Banner
                    </h4>
                    
                    <!-- Image Upload -->
                    <div class="relative">
                        <input type="file" id="leftMainFile_${index}" accept="image/*" class="hidden" onchange="handleImageUpload(this, ${index}, 'leftMain')">
                        <div class="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-blue-500 cursor-pointer" onclick="document.getElementById('leftMainFile_${index}').click()">
                            <i class="fas fa-cloud-upload-alt text-gray-400"></i>
                            <span class="block text-xs text-gray-600 mt-1">Upload Image</span>
                        </div>
                        ${slide.leftMain.imageUrl ? `
                            <div class="mt-2 relative">
                                <img src="${slide.leftMain.imageUrl}" class="w-full h-20 object-cover rounded" alt="preview">
                                <span class="text-xs text-gray-500 block mt-1">${slide.leftMain.imageUrl.split('/').pop()}</span>
                            </div>
                        ` : ''}
                    </div>

                    <input type="text" 
                        value="${slide.leftMain.title || ''}"
                        placeholder="Title" 
                        oninput="updateField(${index}, 'leftMain', 'title', this.value)"
                        class="w-full border rounded-lg p-2 text-sm">

                    <input type="text" 
                        value="${slide.leftMain.redirectUrl || ''}"
                        placeholder="Redirect URL" 
                        oninput="updateField(${index}, 'leftMain', 'redirectUrl', this.value)"
                        class="w-full border rounded-lg p-2 text-sm">

                    <input type="text" 
                        value="${slide.leftMain.imageUrl || ''}"
                        placeholder="Image Path" 
                        oninput="updateField(${index}, 'leftMain', 'imageUrl', this.value)"
                        class="w-full border rounded-lg p-2 text-sm bg-gray-50">
                </div>

                <!-- Right Top Banner -->
                <div class="space-y-3">
                    <h4 class="font-medium text-green-600 flex items-center">
                        <i class="fas fa-arrow-right mr-2"></i>Right Top Banner
                    </h4>

                    <div class="relative">
                        <input type="file" id="rightTopFile_${index}" accept="image/*" class="hidden" onchange="handleImageUpload(this, ${index}, 'rightTop')">
                        <div class="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-green-500 cursor-pointer" onclick="document.getElementById('rightTopFile_${index}').click()">
                            <i class="fas fa-cloud-upload-alt text-gray-400"></i>
                            <span class="block text-xs text-gray-600 mt-1">Upload Image</span>
                        </div>
                        ${slide.rightTop.imageUrl ? `
                            <div class="mt-2 relative">
                                <img src="${slide.rightTop.imageUrl}" class="w-full h-20 object-cover rounded" alt="preview">
                                <span class="text-xs text-gray-500 block mt-1">${slide.rightTop.imageUrl.split('/').pop()}</span>
                            </div>
                        ` : ''}
                    </div>

                    <input type="text" 
                        value="${slide.rightTop.redirectUrl || ''}"
                        placeholder="Redirect URL" 
                        oninput="updateField(${index}, 'rightTop', 'redirectUrl', this.value)"
                        class="w-full border rounded-lg p-2 text-sm">

                    <input type="text" 
                        value="${slide.rightTop.imageUrl || ''}"
                        placeholder="Image Path" 
                        oninput="updateField(${index}, 'rightTop', 'imageUrl', this.value)"
                        class="w-full border rounded-lg p-2 text-sm bg-gray-50">
                </div>

                <!-- Right Card -->
                <div class="space-y-3">
                    <h4 class="font-medium text-purple-600 flex items-center">
                        <i class="fas fa-arrow-right mr-2"></i>Right Card
                    </h4>

                    <input type="text" 
                        value="${slide.rightCard.title || ''}"
                        placeholder="Card Title" 
                        oninput="updateField(${index}, 'rightCard', 'title', this.value)"
                        class="w-full border rounded-lg p-2 text-sm">

                    <textarea 
                        placeholder="Description" 
                        oninput="updateField(${index}, 'rightCard', 'description', this.value)"
                        class="w-full border rounded-lg p-2 text-sm" rows="3">${slide.rightCard.description || ''}</textarea>
                </div>
            </div>
        </div>
    `
}

function updateField(slideIndex, section, field, value) {
    if (section === 'rightCard') {
        slides[slideIndex][section][field] = value
    } else {
        slides[slideIndex][section][field] = value
    }
}

function handleImageUpload(input, slideIndex, section) {
    const file = input.files[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = function(e) {
            // In real app, you'd upload to server and get URL
            // For demo, we'll use a fake path
            const imagePath = `/uploads/banners/${file.name}`
            
            if (section === 'leftMain') {
                slides[slideIndex].leftMain.imageUrl = imagePath
            } else if (section === 'rightTop') {
                slides[slideIndex].rightTop.imageUrl = imagePath
            }
            
            renderSlides()
            showToast('Image uploaded successfully', 'success')
        }
        reader.readAsDataURL(file)
    }
}

function previewBannerImage(input, previewId) {
    const file = input.files[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = function(e) {
            const preview = document.getElementById(previewId)
            const img = preview.querySelector('img')
            const nameSpan = document.getElementById(previewId.replace('preview', '') + 'Name')
            
            img.src = e.target.result
            nameSpan.textContent = file.name
            preview.classList.remove('hidden')
            
            // Update path input
            const pathInput = document.getElementById(input.id.replace('File', 'Path'))
            if (pathInput) {
                pathInput.value = `/uploads/banners/${file.name}`
            }
        }
        reader.readAsDataURL(file)
    }
}

function moveSlideUp(index) {
    if (index > 0) {
        [slides[index - 1], slides[index]] = [slides[index], slides[index - 1]]
        updateDotPositions()
        renderSlides()
        showToast('Slide moved up', 'success')
    }
}

function moveSlideDown(index) {
    if (index < slides.length - 1) {
        [slides[index], slides[index + 1]] = [slides[index + 1], slides[index]]
        updateDotPositions()
        renderSlides()
        showToast('Slide moved down', 'success')
    }
}

function updateDotPositions() {
    slides.forEach((slide, index) => {
        slide.dotPosition = index + 1
    })
    updateSlideCount()
}

function updateSlideCount() {
    document.getElementById('slideCount').textContent = `${slides.length} Slide${slides.length !== 1 ? 's' : ''}`
}

function setupSlideFileInputs(index) {
    // This function would handle any additional setup for file inputs
    // For now, it's a placeholder
}

function saveData() {
    const payload = {
        pageName: currentPage,
        slides: slides,
        bannerFileTwo: document.getElementById('bannerTwoPath').value,
        bannerFileThree: document.getElementById('bannerThreePath').value,
        bannerFileFour: document.getElementById('bannerFourPath').value,
        lastUpdated: new Date().toISOString()
    }

    // Save to localStorage
    localStorage.setItem('bannerData', JSON.stringify(payload))
    
    console.log('Saved Payload:', payload)
    showToast('Banner data saved successfully!', 'success')

    /* API Call Example
    fetch(`/api/banner/page/${currentPage}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => showToast('Data synced with server', 'success'))
    .catch(error => showToast('Error syncing with server', 'error'))
    */
}

function exportData() {
    const payload = {
        pageName: currentPage,
        slides: slides,
        bannerFileTwo: document.getElementById('bannerTwoPath').value,
        bannerFileThree: document.getElementById('bannerThreePath').value,
        bannerFileFour: document.getElementById('bannerFourPath').value,
        exportedAt: new Date().toISOString()
    }

    const dataStr = JSON.stringify([payload], null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `banner-data-${currentPage}-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    showToast('Data exported successfully', 'success')
}

function handleBulkUpload(event) {
    const file = event.target.files[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result)
                if (Array.isArray(data) && data.length > 0) {
                    slides = JSON.parse(JSON.stringify(data[0].slides))
                    document.getElementById('bannerTwoPath').value = data[0].bannerFileTwo || ''
                    document.getElementById('bannerThreePath').value = data[0].bannerFileThree || ''
                    document.getElementById('bannerFourPath').value = data[0].bannerFileFour || ''
                    
                    renderSlides()
                    updateSlideCount()
                    showToast('Bulk upload successful', 'success')
                }
            } catch (error) {
                showToast('Invalid JSON file', 'error')
            }
        }
        reader.readAsText(file)
    }
}

function previewChanges() {
    const previewContent = document.getElementById('previewContent')
    const payload = {
        pageName: currentPage,
        slides: slides,
        banners: {
            two: document.getElementById('bannerTwoPath').value,
            three: document.getElementById('bannerThreePath').value,
            four: document.getElementById('bannerFourPath').value
        }
    }
    
    previewContent.innerHTML = `<pre class="bg-gray-50 p-4 rounded-lg overflow-x-auto">${JSON.stringify(payload, null, 2)}</pre>`
    document.getElementById('previewModal').classList.add('flex')
    document.getElementById('previewModal').classList.remove('hidden')
}

function closePreview() {
    document.getElementById('previewModal').classList.add('hidden')
    document.getElementById('previewModal').classList.remove('flex')
}

function reorderSlides() {
    const reorderList = document.getElementById('reorderList')
    let html = '<div class="space-y-2">'
    
    slides.forEach((slide, index) => {
        html += `
            <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <i class="fas fa-grip-vertical text-gray-400 cursor-move"></i>
                <span class="font-medium">Slide ${index + 1}:</span>
                <span class="text-sm text-gray-600">${slide.leftMain.title || 'Untitled'}</span>
                <input type="number" value="${index + 1}" min="1" max="${slides.length}" 
                    class="w-16 ml-auto border rounded p-1 text-center" 
                    onchange="reorderSlide(${index}, this.value)">
            </div>
        `
    })
    
    html += '</div>'
    reorderList.innerHTML = html
    document.getElementById('reorderModal').classList.add('flex')
    document.getElementById('reorderModal').classList.remove('hidden')
}

function reorderSlide(oldIndex, newPosition) {
    // Implementation for reordering
    // This is a simplified version
    newPosition = parseInt(newPosition) - 1
    if (newPosition >= 0 && newPosition < slides.length && newPosition !== oldIndex) {
        const [movedSlide] = slides.splice(oldIndex, 1)
        slides.splice(newPosition, 0, movedSlide)
        updateDotPositions()
        renderSlides()
    }
}

function applyReorder() {
    closeReorderModal()
    showToast('Slides reordered successfully', 'success')
}

function closeReorderModal() {
    document.getElementById('reorderModal').classList.add('hidden')
    document.getElementById('reorderModal').classList.remove('flex')
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast')
    toast.textContent = message
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-transform translate-y-0 ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
    } text-white`
    
    toast.classList.remove('hidden')
    
    setTimeout(() => {
        toast.classList.add('hidden')
    }, 3000)
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeApp)