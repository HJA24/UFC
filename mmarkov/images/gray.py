import cv2


img = cv2.imread(f"/Users/huibmeulenbelt/PycharmProjects/ufc/mmarkov/images/ufc 189 weigh-in.jpg")

top, bottom = 400, 200
h, w = img.shape[:2]
if top + bottom >= h:
    raise ValueError("top + bottom >= image height")

cropped = img[top : h - bottom, :]


# (Optional) convert to grayscale
gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)


cv2.imshow("Cropped (gray)", gray)       # opens a window
cv2.waitKey(0)                            # wait for a key press
cv2.destroyAllWindows()
cv2.imwrite(f"/Users/huibmeulenbelt/PycharmProjects/ufc/mmarkov/images/gray/cropped ufc 189 weigh-in.jpg", gray)
