from setuptools import setup, find_packages

setup(
    name="agentbazaar",
    version="0.1.0",
    description="AgentBazaar Python SDK — AI Agent marketplace on MultiversX",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    author="George Pricop",
    author_email="contact@agentbazaar.io",
    url="https://github.com/Gzeu/agentbazaar",
    packages=find_packages(),
    python_requires=">=3.10",
    install_requires=[
        "httpx>=0.27.0",
    ],
    extras_require={
        "wallet": ["multiversx-sdk>=0.10.0"],
        "dev":    ["pytest", "pytest-asyncio", "pytest-httpx"],
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Topic :: Software Development :: Libraries",
        "Topic :: Internet :: WWW/HTTP",
    ],
)
