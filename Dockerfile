FROM python:2.7.15-jessie

RUN pip install Pillow numpy

COPY *.py /darkfo/
COPY lut/* /darkfo/lut/

VOLUME ["/output","/game"]

ENTRYPOINT cd /output && cp -r /darkfo/lut/ .  && python /darkfo/setup.py /game/
